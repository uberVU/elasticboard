function drawInsights () {
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
                series: [{
                    name: 'Opened',
                    data: opened.reduceRight(function (arr, el) {
                        arr.push(el.value);
                        return arr;
                    }, []),
                    lineColor: '#FF4E50',
                    color: '#FF4E50'
                }, {
                    name: 'Closed',
                    data: closed.reduceRight(function (arr, el) {
                        arr.push(el.value);
                        return arr;
                    }, []),
                    lineColor: '#88C425',
                    color: '#88C425'
                }]
            });
        })
        .fail(logFailure);


}
