"""
Unit tests for FeedbackService.
"""

import pytest
from datetime import datetime, timezone

from app.services.feedback_service import FeedbackService
from app.schemas.feedback import RawFeedbackCreate


@pytest.fixture
def feedback_service():
    return FeedbackService()


@pytest.fixture
def sample_feedback_data():
    return RawFeedbackCreate(
        content="Test feedback content",
        author_name="Test User",
        url="https://example.com/test",
        posted_at=datetime.now(timezone.utc),
        source_id=1,
        target_entity_id=1,
        original_post_id="test-123",
    )


class TestFeedbackService:
    """Test cases for FeedbackService."""

    def test_service_initialization(self, feedback_service):
        """Test that FeedbackService can be initialized."""
        assert feedback_service is not None
        assert isinstance(feedback_service, FeedbackService)

    def test_singleton_instance(self):
        """Test that feedback_service is a singleton."""
        from app.services.feedback_service import feedback_service as fs1
        from app.services.feedback_service import feedback_service as fs2
        assert fs1 is fs2

    @pytest.mark.asyncio
    async def test_create_raw_feedback(self, feedback_service, db_session, sample_feedback_data):
        """Test creating a raw feedback."""
        feedback = await feedback_service.create_raw_feedback(db_session, sample_feedback_data)

        assert feedback is not None
        assert feedback.content == "Test feedback content"
        assert feedback.author_name == "Test User"
        assert feedback.url == "https://example.com/test"

    @pytest.mark.asyncio
    async def test_create_duplicate_feedback(self, feedback_service, db_session, sample_feedback_data):
        """Test that creating duplicate feedback raises exception."""
        from app.core.exceptions import DuplicateEntryException

        # Create first feedback
        await feedback_service.create_raw_feedback(db_session, sample_feedback_data)

        # Try to create duplicate
        with pytest.raises(DuplicateEntryException):
            await feedback_service.create_raw_feedback(db_session, sample_feedback_data)

    @pytest.mark.asyncio
    async def test_bulk_create_feedbacks(self, feedback_service, db_session):
        """Test bulk creating feedbacks."""
        feedbacks = [
            RawFeedbackCreate(
                content=f"Feedback {i}",
                author_name=f"User {i}",
                url=f"https://example.com/{i}",
                posted_at=datetime.now(timezone.utc),
                source_id=1,
                target_entity_id=1,
                original_post_id=f"bulk-{i}",
            )
            for i in range(5)
        ]

        inserted = await feedback_service.bulk_create_raw_feedbacks(db_session, feedbacks)
        assert inserted == 5

    @pytest.mark.asyncio
    async def test_bulk_create_with_duplicates(self, feedback_service, db_session):
        """Test bulk creating feedbacks with duplicates."""
        feedbacks = [
            RawFeedbackCreate(
                content="Same content",
                author_name="User",
                url="https://example.com/1",
                posted_at=datetime.now(timezone.utc),
                source_id=1,
                target_entity_id=1,
                original_post_id="dup-1",
            ),
            RawFeedbackCreate(
                content="Same content",
                author_name="User",
                url="https://example.com/1",
                posted_at=datetime.now(timezone.utc),
                source_id=1,
                target_entity_id=1,
                original_post_id="dup-1",  # Same ID = duplicate
            ),
            RawFeedbackCreate(
                content="Different content",
                author_name="User 2",
                url="https://example.com/2",
                posted_at=datetime.now(timezone.utc),
                source_id=1,
                target_entity_id=1,
                original_post_id="dup-2",
            ),
        ]

        inserted = await feedback_service.bulk_create_raw_feedbacks(db_session, feedbacks)
        assert inserted == 2  # Only 2 unique

    @pytest.mark.asyncio
    async def test_export_to_csv(self, feedback_service, db_session):
        """Test CSV export."""
        # Create some feedbacks first
        feedbacks = [
            RawFeedbackCreate(
                content=f"Export test {i}",
                author_name=f"User {i}",
                url=f"https://example.com/{i}",
                posted_at=datetime.now(timezone.utc),
                source_id=1,
                target_entity_id=1,
                original_post_id=f"export-{i}",
            )
            for i in range(3)
        ]
        await feedback_service.bulk_create_raw_feedbacks(db_session, feedbacks)

        # Export to CSV
        csv_content = await feedback_service.export_to_csv(db_session)

        assert csv_content is not None
        assert "content" in csv_content  # Header
        assert "Export test" in csv_content

    @pytest.mark.asyncio
    async def test_export_to_excel(self, feedback_service, db_session):
        """Test Excel export."""
        # Create some feedbacks first
        feedbacks = [
            RawFeedbackCreate(
                content=f"Excel test {i}",
                author_name=f"User {i}",
                url=f"https://example.com/{i}",
                posted_at=datetime.now(timezone.utc),
                source_id=1,
                target_entity_id=1,
                original_post_id=f"excel-{i}",
            )
            for i in range(3)
        ]
        await feedback_service.bulk_create_raw_feedbacks(db_session, feedbacks)

        # Export to Excel
        excel_bytes = await feedback_service.export_to_excel(db_session)

        assert excel_bytes is not None
        assert len(excel_bytes) > 0
