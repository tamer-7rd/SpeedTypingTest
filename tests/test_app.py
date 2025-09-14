import pytest
from main import app, email_sender

@pytest.fixture
def client():
    app.config.update(TESTING=True)
    with app.test_client() as client:     # Returns object that can send HTTP requests:
        yield client

def test_home_ok(client):
    resp = client.get('/')
    assert resp.status_code == 200

def test_learn_ok(client):
    resp = client.get('/learn')
    assert resp.status_code == 200

def test_about_ok(client):
    resp = client.get('/about')
    assert resp.status_code == 200

def test_results_ok(client):
    resp = client.get('/results?wpm=50&accuracy=95&time=30&correctChars=100&incorrectChars=5')
    assert resp.status_code == 200

def test_contact_post_sends_email(monkeypatch, client):
    called = {}
    def fake_send_email(name, email, number, message):
        called['args'] = (name, email, number, message)
    monkeypatch.setattr(email_sender, 'send_email', fake_send_email)

    form = dict(name='John', email='john@example.com', number='123', message='Hi there')
    resp = client.post('/contact', data=form)
    assert resp.status_code == 200
    assert called['args'] == ('John', 'john@example.com', '123', 'Hi there')



