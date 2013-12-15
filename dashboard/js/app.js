var API_BASE = 'http://127.0.0.1:5000/';

function makeBarGraph(container, endpoint, keyName, valueName) {
    $.getJSON(API_BASE + endpoint).done(function (json) {
        data = json.data;
        $(container).highcharts({
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Most active people'
            },
            xAxis: {
                categories: data.map(function (e) { return e[keyName]; })
            },
            yAxis: {
                min: 0,
                title: {
                    text: "Events"
                }
            },
            legend: {
                enabled: false
            },
            series: [{
                name: "Events",
                data: data.map(function (e) { return e[valueName]; })
            }]
        });
    });
}

makeBarGraph('#most-active-people', 'gabrielfalcao/lettuce/most_active_people', 'term', 'count');
