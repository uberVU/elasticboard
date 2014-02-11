function drawIssuesActivity() {
    $.getJSON(API_BASE + '/issues_activity')
        .done(function (json) {
            data = json.data;
            var opened = data.opened;
            var closed = data.closed;
            $('#issues-activity').highcharts({
                chart: {
                    type: 'areaspline'
                },
                title: {
                    text: 'Issues Burndown'
                },
                xAxis: {
                    categories: opened.map(function(e) { return e.month; })
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Events'
                    }
                },
                legend: {
                    enabled: false
                },
                series: [
                    {
                        name: 'Opened',
                        data: opened.map(function(e) { return e.value; }),
                        lineColor: '#FF4E50',
                        color: '#FF4E50'
                    },
                    {
                        name: 'Closed',
                        data: closed.map(function(e) { return e.value; }),
                        lineColor: '#88C425',
                        color: '#88C425'
                    }
                ]
            });
        })
        .fail(logFailure);
}

var issuesListTemplate = Handlebars.compile($('#issues-list-template').html());

function drawUntouchedIssues() {
    $.getJSON(API_BASE + '/untouched_issues')
        .done(function(json) {
            var data = json.data;
            var context = {
                issues: data,
                title: "Untouched Issues"
            }
            var $list = $(issuesListTemplate(context));
            $('#untouched-issues').empty().append($list);
        })
        .fail(logFailure);
}

function drawInactiveIssues() {
    $.getJSON(API_BASE + '/inactive_issues')
        .done(function(json) {
            var data = json.data;
            var context = {
                issues: data,
                title: "Inactive Issues (2 weeks)"
            }
            var $list = $(issuesListTemplate(context));
            $('#inactive-issues').empty().append($list);
        })
        .fail(logFailure);
}

function drawInsights () {
    drawIssuesActivity();
    drawUntouchedIssues();
    drawInactiveIssues();
}
