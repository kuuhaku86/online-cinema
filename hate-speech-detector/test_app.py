import pytest
from unittest.mock import patch
from app import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestAnalyzeInputValidation:
    def test_missing_json_body(self, client):
        response = client.post('/analyze', data='not json')
        assert response.status_code == 400
        assert response.get_json()['error'] == 'Request must be JSON'

    def test_missing_text_key(self, client):
        response = client.post('/analyze', json={})
        assert response.status_code == 400
        assert 'Missing' in response.get_json()['error']

    def test_text_not_a_string(self, client):
        response = client.post('/analyze', json={'text': 42})
        assert response.status_code == 400
        assert 'must be a string' in response.get_json()['error']

    def test_text_is_empty_string(self, client):
        response = client.post('/analyze', json={'text': ''})
        assert response.status_code == 400
        assert 'cannot be empty' in response.get_json()['error']

    def test_text_is_whitespace_only(self, client):
        response = client.post('/analyze', json={'text': '   '})
        assert response.status_code == 400
        assert 'cannot be empty' in response.get_json()['error']


class TestAnalyzeBehavior:
    @patch('app.isHate')
    def test_benign_text_returns_is_hate_false(self, mock_isHate, client):
        mock_isHate.return_value = {'message': 'ok', 'isHate': False}
        response = client.post('/analyze', json={'text': 'hello there'})
        assert response.status_code == 200
        assert response.get_json()['isHate'] is False

    @patch('app.isHate')
    def test_hate_speech_returns_is_hate_true(self, mock_isHate, client):
        mock_isHate.return_value = {'message': 'hate detected', 'isHate': True}
        response = client.post('/analyze', json={'text': 'hateful content'})
        assert response.status_code == 200
        assert response.get_json()['isHate'] is True

    @patch('app.isHate')
    def test_model_exception_returns_500(self, mock_isHate, client):
        mock_isHate.side_effect = RuntimeError('model crash')
        response = client.post('/analyze', json={'text': 'whatever'})
        assert response.status_code == 500
        assert 'internal error' in response.get_json()['error']
