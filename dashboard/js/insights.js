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
                    categories: opened.reduceRight(function (arr, el) {
                        arr.push(el.month);
                        return arr;
                    }, [])
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
                        data: opened.reduceRight(function (arr, el) {
                            arr.push(el.value);
                            return arr;
                        }, []),
                        lineColor: '#FF4E50',
                        color: '#FF4E50'
                    },
                    {
                        name: 'Closed',
                        data: closed.reduceRight(function (arr, el) {
                            arr.push(el.value);
                            return arr;
                        }, []),
                        lineColor: '#88C425',
                        color: '#88C425'
                    }
                ]
            });
        })
        .fail(logFailure);
}

var untouchedIssuesTemplate = Handlebars.compile($('#untouched-issues-template').html());

function drawUntouchedIssues() {
    $.getJSON(API_BASE + '/untouched_issues')
        .done(function(json) {
            var data = json.data;
            var $list = $(untouchedIssuesTemplate({issues: data}));
            $('#untouched-issues').empty().append($list);
        })
        .fail(logFailure);
}

function drawInsights () {
    drawIssuesActivity();
    drawUntouchedIssues();
}
