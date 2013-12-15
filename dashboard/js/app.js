var API_BASE = 'http://127.0.0.1:5000/';

function logFailure(fail) {
    console.log("Trouble getting data. API server down?");
    console.log(fail);
}


function makeXYGraph(container, options) {
    $.getJSON(API_BASE + options.endpoint)
        .done(function (json) {
            data = json.data;
            $(container).highcharts({
                chart: {
                    type: options.type
                },
                title: {
                    text: options.title
                },
                subtitle: {
                    text: options.subtitle
                },
                xAxis: {
                    categories: data.map(function (e) { return e[options.keyName]; })
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: options.yTitle
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: options.label,
                    data: data.map(function (e) { return e[options.valueName]; })
                }]
            });
        })
        .fail(logFailure);
}

makeXYGraph('#most-active-people', {
    endpoint: 'gabrielfalcao/lettuce/most_active_people',
    type: 'bar',
    title: "Most active people",
    keyName: 'term',
    valueName: 'count',
    yTitle: 'Events',
    label: 'events'
});
makeXYGraph('#total-events-monthly', {
    endpoint: 'gabrielfalcao/lettuce/total_events_monthly',
    type: 'area',
    title: "Activity",
    subtitle: "Total monthly events",
    keyName: 'month',
    valueName: 'value',
    yTitle: 'Events',
    label: 'events'
});
