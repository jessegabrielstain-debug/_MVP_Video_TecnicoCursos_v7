import requests
import time
import json
from auth_utils import get_authenticated_headers

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_video_editor_slide_manipulation_and_preview():
    headers = get_authenticated_headers()
    project_id = None

    try:
        # Step 1: Create a new video project
        print("Creating new project...")
        project_payload = {
            "name": "Test Project for Slide Manipulation",
            "description": "Project created for testing slide editor manipulation.",
            "type": "custom",
            "settings": {
                "width": 1920,
                "height": 1080,
                "fps": 30
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/projects",
            json=project_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        
        if response.status_code != 201:
            print(f"Create project failed: {response.text}")
        assert response.status_code == 201, f"Failed to create project: {response.status_code}"
        
        project_data = response.json().get("data", {})
        project_id = project_data.get("id")
        assert project_id, "Project ID not returned"
        print(f"Project created: {project_id}")

        # Step 2: Get initial timeline state
        print("Fetching initial timeline...")
        timeline_url = f"{BASE_URL}/api/timeline/projects/{project_id}"
        response = requests.get(timeline_url, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Failed to fetch timeline: {response.status_code}"
        timeline = response.json()
        
        # Step 3: Manipulate timeline (Add slides/tracks)
        # We simulate adding a 'Slides PPTX' track with elements, which triggers slide sync on backend
        print("Updating timeline with slides...")
        
        # Construct a timeline payload
        new_timeline = {
            "id": project_id,
            "name": "Updated Timeline",
            "width": 1920,
            "height": 1080,
            "fps": 30,
            "duration": 60,
            "tracks": [
                {
                    "id": "track-1",
                    "name": "Slides PPTX", # Important for backend sync logic
                    "type": "video",
                    "elements": [
                        {
                            "id": "el-1",
                            "name": "Slide 1",
                            "type": "image",
                            "start": 0,
                            "duration": 5,
                            "properties": {
                                "content": "Content for slide 1",
                                "src": "http://example.com/slide1.png"
                            }
                        },
                        {
                            "id": "el-2",
                            "name": "Slide 2",
                            "type": "image",
                            "start": 5,
                            "duration": 5,
                            "properties": {
                                "content": "Content for slide 2",
                                "src": "http://example.com/slide2.png"
                            }
                        }
                    ]
                }
            ]
        }
        
        response = requests.put(
            timeline_url,
            json=new_timeline,
            headers=headers,
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            print(f"Update timeline failed: {response.text}")
        assert response.status_code == 200, f"Failed to update timeline: {response.status_code}"
        result = response.json()
        assert result.get("success") is True, "Update response success is not True"
        
        # Step 4: Verify persistence
        print("Verifying persistence...")
        response = requests.get(timeline_url, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200
        fetched_timeline = response.json()
        
        tracks = fetched_timeline.get("tracks", [])
        assert len(tracks) > 0, "Tracks not persisted"
        assert tracks[0]["name"] == "Slides PPTX", "Track name mismatch"
        assert len(tracks[0]["elements"]) == 2, "Elements not persisted"
        assert tracks[0]["elements"][1]["name"] == "Slide 2", "Element content mismatch"
        
        # Optional: Verify slides table sync (if we had an endpoint for it, but we rely on timeline endpoint for now)
        
        print("TC003 Passed!")

    finally:
        # Cleanup
        if project_id:
            print(f"Cleaning up project {project_id}...")
            requests.delete(
                f"{BASE_URL}/api/projects/{project_id}",
                headers=headers,
                timeout=TIMEOUT,
            )

if __name__ == "__main__":
    test_video_editor_slide_manipulation_and_preview()
