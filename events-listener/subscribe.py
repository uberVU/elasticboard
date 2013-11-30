import json
import requests


def make_json(url):
    all_the_things = {
            'active': True,
            'config': {'url': url},
            'name': 'web',
            'events': [
                'push',
                'issues',
                'issue_comment',
                'commit_comment',
                'create',
                'delete',
                'pull_request',
                'pull_request_review_comment',
                'gollum',
                'watch',
                'release',
                'fork',
                'member',
                'public',
                'team_add',
                'status',
            ],
    }
    return all_the_things

def subscribe_web_hook(owner, repo, url, username, password):
    """
    Adds a web hook that sends notifications for all possible events.
    """
    api_url = 'https://api.github.com/repos/%s/%s/hooks' % (owner, repo)
    r = requests.post(api_url, data=json.dumps(make_json(url)),
                      auth=(username, password))
    return r.ok

