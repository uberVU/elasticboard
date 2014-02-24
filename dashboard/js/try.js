var $repo = $('.input--repository');
var data;

$repo.on('keyup', function() {

  var repoName = $(this).val();

  if (window._timeout) {
    clearTimeout(window._timeout);
  }
  window._timeout = setTimeout(function() {
    selectedRepo(repoName);
  }, 300);

});

$('.input--owner').on('focusout', function() {
  var owner = $(this).val();
  var url = 'https://api.github.com/users/' + owner + '/repos?per_page=1000';

  if (!owner) {
    alert('You did not write a username');
    $(this).focus();
    return;
  }

  $.get(url)
  .success(autocompleteRepos)
  .fail(handleFail)

});

function selectedRepo(repoName) {
  
  if (!data) return; // data has not loaded just yet

  if (data.some(equal(repoName))) {
    // show dashboard link
    var container = $('.form');
    var link = $('<a/>').attr('href', '#').text('Go to your dashboard');
    var h2 = $('<h2/>').append(link);
    container.html('').append(h2);
  }

}

function equal(val) {
  return function (obj) {
    return obj.name == val;
  };
}

function autocompleteRepos(d) {

  if (d.message) {
    alert("User not found :(");
    $('.input--owner').val('').focus();
    return;
  }

  if (!d.length) {
    alert('No repos found :(');
    return;
  }

  data = d;

  var numbers = new Bloodhound({
    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.name); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: data
  });

  numbers.initialize();

  $repo.typeahead(null, {
    displayKey: 'name',
    source: numbers.ttAdapter()
  });

  $repo.focus();
}

function handleFail(data) {
  console.log(data);
  alert('Something bad happend :( Check out the existing repos in the dashboard');
}
