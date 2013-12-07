from es import ES

import datetime
import elasticsearch

SIZE = 100
DATEFORMAT = '%Y-%m-%dT%H:%M:%SZ'

def timestamp_range_query(field, start, end):
    """
    If both start and end are none, returns just an empty query.
    Otherwise, returns an empty filtered query for the given
    start and end datetimes on _field_.
    """
    if start == None and end == None:
        return {}

    if start == None:
        start = datetime.datetime(year=1970, month=1, day=1)
    if end == None:
        end = datetime.datetime.now()

    start_ts = start.strftime(DATEFORMAT)
    end_ts = end.strftime(DATEFORMAT)

    body = {
        'query': {
            'filtered': {
                'filter': {
                    'range': {
                        field: {
                            'from': start_ts,
                            'to': end_ts}}}}}}
    return body

def most_active_people(index, start=None, end=None):
    """
    Finds the most active users - as actors in all the events.
    Returns a list of dicts like:
    {'count': N, 'term': NAME}
    """
    body = timestamp_range_query('created_at', start, end)
    body['facets'] = {
            'people': {
                'terms': {
                    'field': 'actor.login',
                    'size': SIZE}}}
    body['size'] = 0

    res = ES.search(index=index, body=body)
    return res['facets']['people']['terms']

