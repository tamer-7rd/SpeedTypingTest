import pytest
import json
import os
import tempfile
from main import app, email_sender, leaderboard_manager

@pytest.fixture
def client():
    app.config.update(TESTING=True)
    with app.test_client() as client:
        yield client

@pytest.fixture
def temp_leaderboard_file():
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        json.dump([], f)
        temp_file = f.name

    original_path = leaderboard_manager.leaderboard_file
    leaderboard_manager.leaderboard_file = temp_file

    yield temp_file

    leaderboard_manager.leaderboard_file = original_path
    os.unlink(temp_file)    


def test_home_ok(client):
    """Test home page returns 200 status code"""
    resp = client.get('/')
    assert resp.status_code == 200

def test_learn_ok(client):
    """Test learn page returns 200 status code"""
    resp = client.get('/learn')
    assert resp.status_code == 200

def test_about_ok(client):
    """Test about page returns 200 status code"""
    resp = client.get('/about')
    assert resp.status_code == 200

def test_results_ok(client):
    """Test results page with valid parameters returns 200 status code"""
    resp = client.get('/results?wpm=40&accuracy=95&time=30&correctChars=100&incorrectChars=5')
    assert resp.status_code == 200

def test_results_with_missing_params(client):
    """Test results page with missing parameters redirects to home page"""
    resp = client.get('/results')
    assert resp.status_code == 302  #redirect to '/'

def test_results_with_invalid_params(client):
    """Test results page with invalid parameters redirects to home page"""
    resp = client.get('/results?wpm=invalid&accuracy=abc')
    assert resp.status_code == 302  #redirect to '/'    

def test_leaderboard_ok(client):
    """Test leaderboard POST and GET requests return 200 status code"""
    form = dict(
        username='TestUser',
        email='test@example.com', 
        country='TestCountry',
        wpm=50.0,
        acc=95.0
    )    
    resp_post = client.post('/leaderboard', data=form)  
    resp_get = client.get('/leaderboard')               
    assert resp_post.status_code == 200
    assert resp_get.status_code == 200

def test_contact_get(client):
    """Test GET request to /contact returns 200 and contains expected content"""
    resp = client.get('/contact')
    assert resp.status_code == 200
    assert b'Get in touch' in resp.data    

def test_contact_post_sends_email(monkeypatch, client):
    """Test POST request to /contact calls email sender with correct parameters"""
    called = {}
    def fake_send_email(name, email, number, message):
        called['args'] = (name, email, number, message)
    monkeypatch.setattr(email_sender, 'send_email', fake_send_email)

    form = dict(name='John', email='john@example.com', number='123', message='Hi there')
    resp = client.post('/contact', data=form)
    assert resp.status_code == 200
    assert called['args'] == ('John', 'john@example.com', '123', 'Hi there')

def test_email_sender_initialization():
    """Test EmailSender initialization has required attributes"""
    from email_sender import EmailSender
    sender = EmailSender()
    assert hasattr(sender, 'today')    


# LeaderboardManager tests
def test_leaderboard_manager_load_empty(temp_leaderboard_file):
    """Test loading empty leaderboard returns empty list"""
    data = leaderboard_manager.load_leaderboard()
    assert data == []

def test_leaderboard_manager_save_and_load(temp_leaderboard_file):
    """Test saving and loading leaderboard data preserves content"""
    test_data = [{"username": "Test", "wpm": 50, "accuracy": 95, "coef": 47.5}]
    leaderboard_manager.save_leaderboard(test_data)
    loaded_data = leaderboard_manager.load_leaderboard()
    assert loaded_data == test_data

def test_leaderboard_manager_add_new_entry(temp_leaderboard_file):
    """Test adding new entry to leaderboard with correct data and position"""
    leaderboard, position = leaderboard_manager.add_to_leaderboard(
        "NewUser", "test@test.com", "TestCountry", 60.0, 90.0, 54.0
    )
    assert len(leaderboard) == 1
    assert leaderboard[0]["username"] == "NewUser"
    assert leaderboard[0]["wpm"] == 60.0
    assert leaderboard[0]["accuracy"] == 90.0
    assert leaderboard[0]["coef"] == 54.0
    assert position == 1

def test_leaderboard_manager_duplicate_detection(temp_leaderboard_file):
    """Test duplicate entries are not added to leaderboard"""
    leaderboard_manager.add_to_leaderboard("User1", "test@test.com", "Country1", 50.0, 95.0, 47.5)    
    leaderboard, position = leaderboard_manager.add_to_leaderboard("User1", "test@test.com", "Country1", 50.0, 95.0, 47.5)
    assert len(leaderboard) == 1  
    assert position == 1  

def test_leaderboard_manager_sorting(temp_leaderboard_file):
    """Test leaderboard entries are sorted by coefficient in descending order"""
    leaderboard_manager.add_to_leaderboard("User1", "test1@test.com", "Country1", 50.0, 80.0, 40.0)
    leaderboard_manager.add_to_leaderboard("User2", "test2@test.com", "Country2", 60.0, 90.0, 54.0)
    leaderboard_manager.add_to_leaderboard("User3", "test3@test.com", "Country3", 40.0, 95.0, 38.0)
    
    leaderboard = leaderboard_manager.load_leaderboard()
    
    assert leaderboard[0]["coef"] == 54.0  # User2
    assert leaderboard[1]["coef"] == 40.0  # User1
    assert leaderboard[2]["coef"] == 38.0  # User3

def test_leaderboard_manager_max_entries(temp_leaderboard_file):
    """Test leaderboard limits entries to maximum of 50"""
    for i in range(55):
        leaderboard_manager.add_to_leaderboard(f"User{i}", f"test{i}@test.com", f"Country{i}", 50.0, 80.0, 40.0)
    
    leaderboard = leaderboard_manager.load_leaderboard()
    assert len(leaderboard) == 50  


def test_leaderboard_post_missing_fields(client):
    """Test POST /leaderboard with missing required fields returns 400 status code"""
    form = dict(username='TestUser')  
    resp = client.post('/leaderboard', data=form)
    assert resp.status_code == 400  # Bad Request

def test_leaderboard_post_invalid_data_types(client):
    """Test POST /leaderboard with invalid data types returns 400 status code"""
    form = dict(
        username='TestUser',
        email='test@example.com',
        country='TestCountry',
        wpm='invalid',  # Not a number
        acc='invalid'   # Not a number
    )
    resp = client.post('/leaderboard', data=form)
    assert resp.status_code == 400


def test_leaderboard_corrupted_file(temp_leaderboard_file):
    """Test handling of corrupted JSON file returns empty list"""
    # Write invalid JSON
    with open(temp_leaderboard_file, 'w') as f:
        f.write('invalid json content')
    
    # Should return empty list
    data = leaderboard_manager.load_leaderboard()
    assert data == []

def test_leaderboard_coefficient_calculation(client):
    """Test coefficient calculation is correct for leaderboard entries"""
    form = dict(
        username='TestUser',
        email='test@example.com',
        country='TestCountry',
        wpm=100.0,
        acc=80.0
    )
    resp = client.post('/leaderboard', data=form)
    assert resp.status_code == 200
    
    # Check that coefficient is passed to template (in HTML may be in different format)
    # Or check through leaderboard_manager directly
    leaderboard = leaderboard_manager.load_leaderboard()
    if leaderboard:
        # Find our entry (it may not be first due to sorting)
        test_entry = None
        for entry in leaderboard:
            if (entry['username'] == 'TestUser' and 
                entry['wpm'] == 100.0 and 
                entry['accuracy'] == 80.0):
                test_entry = entry
                break
        
        assert test_entry is not None
        assert test_entry['coef'] == 80.0

def test_leaderboard_timestamp_generation(temp_leaderboard_file):
    """Test timestamp and date generation for leaderboard entries"""
    leaderboard, _ = leaderboard_manager.add_to_leaderboard(
        "TestUser", "test@test.com", "TestCountry", 50.0, 95.0, 47.5
    )
    
    entry = leaderboard[0]
    assert 'timestamp' in entry
    assert 'date' in entry
    assert entry['timestamp'] is not None
    assert entry['date'] is not None