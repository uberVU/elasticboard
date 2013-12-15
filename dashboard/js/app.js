data = [
  {
    "count": 443,
    "term": "gabrielfalcao"
  },
  {
    "count": 50,
    "term": "hectord"
  },
  {
    "count": 36,
    "term": "danni"
  },
  {
    "count": 32,
    "term": "koterpillar"
  },
  {
    "count": 30,
    "term": "starenka"
  },
  {
    "count": 22,
    "term": "tezro"
  },
  {
    "count": 21,
    "term": "dhrrgn"
  },
  {
    "count": 20,
    "term": "olemis"
  },
  {
    "count": 9,
    "term": "tonyqtran"
  },
  {
    "count": 9,
    "term": "cezor"
  }
];

$('#most-active-people').highcharts({
    chart: {
        type: 'bar'
    },
    title: {
        text: 'Most active people'
    },
    xAxis: {
        categories: data.map(function(e) { return e.term; })
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
        data: data.map(function(e) { return e.count; })
    }]
});