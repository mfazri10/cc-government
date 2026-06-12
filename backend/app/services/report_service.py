"""
Service Layer: Report generation.
Generate PDF reports untuk analytics dan feedback summary.
"""

import io
from datetime import datetime, timezone

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import RawFeedback, AnalyzedFeedback, TargetEntity, Source


class ReportService:
    """Generate PDF reports."""

    async def generate_analytics_report(
        self,
        db: AsyncSession,
        days: int = 30,
        entity_id: int | None = None,
    ) -> bytes:
        """Generate analytics summary report dalam PDF."""
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.units import inch

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
        )
        elements.append(Paragraph("GOVMIND - Laporan Analisis Sentimen", title_style))
        elements.append(Paragraph(
            f"Periode: {days} hari terakhir | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 20))

        # Total feedbacks
        total = (await db.execute(
            select(func.count(RawFeedback.id))
        )).scalar() or 0

        elements.append(Paragraph(f"Total Feedback: {total}", styles['Heading2']))
        elements.append(Spacer(1, 10))

        # Sentiment distribution
        sentiment_data = [["Sentimen", "Jumlah", "Persentase"]]
        for sentiment in ["POSITIVE", "NEGATIVE", "NEUTRAL"]:
            count = (await db.execute(
                select(func.count(AnalyzedFeedback.feedback_id))
                .where(AnalyzedFeedback.sentiment == sentiment)
            )).scalar() or 0
            pct = f"{(count/total*100):.1f}%" if total > 0 else "0%"
            sentiment_data.append([sentiment, str(count), pct])

        table = Table(sentiment_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(Paragraph("Distribusi Sentimen", styles['Heading3']))
        elements.append(table)
        elements.append(Spacer(1, 20))

        # Top entities by feedback count
        elements.append(Paragraph("Top OPD by Feedback", styles['Heading3']))
        entity_data = [["OPD", "Feedback", "Sentimen Dominan"]]

        top_entities = await db.execute(
            select(
                TargetEntity.name,
                func.count(RawFeedback.id).label("cnt"),
            )
            .join(RawFeedback, RawFeedback.target_entity_id == TargetEntity.id)
            .group_by(TargetEntity.name)
            .order_by(func.count(RawFeedback.id).desc())
            .limit(10)
        )

        for name, count in top_entities.all():
            entity_data.append([name[:30], str(count), "-"])

        if len(entity_data) > 1:
            entity_table = Table(entity_data)
            entity_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(entity_table)

        elements.append(Spacer(1, 20))

        # Needs attention
        attention_count = (await db.execute(
            select(func.count(AnalyzedFeedback.feedback_id))
            .where(AnalyzedFeedback.needs_attention == True)
        )).scalar() or 0

        elements.append(Paragraph(
            f"⚠️ Feedback Butuh Perhatian: {attention_count}",
            styles['Heading3']
        ))

        # Build PDF
        doc.build(elements)
        return buffer.getvalue()


# Singleton instance
report_service = ReportService()
