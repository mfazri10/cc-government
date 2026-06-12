"""
Integration tests for Feedback API endpoints.
"""

import pytest
from datetime import datetime, timezone


class TestFeedbackAPI:
    """Test cases for Feedback API endpoints."""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test health endpoint."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "service" in data

    @pytest.mark.asyncio
    async def test_create_feedback(self, client):
        """Test creating a feedback via API."""
        feedback_data = {
            "content": "API test feedback",
            "author_name": "API User",
            "url": "https://example.com/api-test",
            "posted_at": datetime.now(timezone.utc).isoformat(),
            "source_id": 1,
            "target_entity_id": 1,
            "original_post_id": "api-test-1",
        }

        response = await client.post("/api/v1/feedbacks/", json=feedback_data)
        assert response.status_code == 201

        data = response.json()
        assert data["content"] == "API test feedback"
        assert data["author_name"] == "API User"

    @pytest.mark.asyncio
    async def test_list_feedbacks(self, client):
        """Test listing feedbacks."""
        response = await client.get("/api/v1/feedbacks/")
        assert response.status_code == 200

        data = response.json()
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    @pytest.mark.asyncio
    async def test_list_feedbacks_with_filters(self, client):
        """Test listing feedbacks with filters."""
        # Create a feedback first
        feedback_data = {
            "content": "Filter test feedback",
            "author_name": "Filter User",
            "url": "https://example.com/filter-test",
            "posted_at": datetime.now(timezone.utc).isoformat(),
            "source_id": 1,
            "target_entity_id": 1,
            "original_post_id": "filter-test-1",
        }
        await client.post("/api/v1/feedbacks/", json=feedback_data)

        # Test with sentiment filter
        response = await client.get("/api/v1/feedbacks/?sentiment=POSITIVE")
        assert response.status_code == 200

        # Test with search
        response = await client.get("/api/v1/feedbacks/?search=Filter")
        assert response.status_code == 200

        # Test with date range
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        response = await client.get(f"/api/v1/feedbacks/?start_date={today}")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_export_csv(self, client):
        """Test CSV export endpoint."""
        response = await client.get("/api/v1/export/csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_export_excel(self, client):
        """Test Excel export endpoint."""
        response = await client.get("/api/v1/export/excel")
        assert response.status_code == 200
        assert "spreadsheetml" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_dedup_stats(self, client):
        """Test deduplication stats endpoint."""
        response = await client.get("/api/v1/dedup/stats")
        assert response.status_code == 200

        data = response.json()
        assert "total_feedbacks" in data
        assert "hashed" in data
        assert "unhashed" in data
        assert "duplicate_groups" in data

    @pytest.mark.asyncio
    async def test_scheduler_trigger(self, client):
        """Test scheduler trigger endpoint."""
        response = await client.post("/api/v1/scheduler/trigger-scrape")
        # This might fail if Inngest is not configured, but should return 200
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_list_active_sources(self, client):
        """Test listing active data sources."""
        response = await client.get("/api/v1/scheduler/data-sources")
        assert response.status_code == 200

        data = response.json()
        assert "count" in data
        assert "sources" in data
