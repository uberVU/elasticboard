/* globals $, Bloodhound */

'use strict';

var $repo = $('.input--repository');
var data = [{name:'kreator.js'}];
var user_data = {
  owner: '',
  repository: ''
};

$('#temporary-dashboard').on('click', function() {
  $.post('http://' + location.hostname + ':5000/add_temporary_river', user_data)
    .success(showRedirectModal)
    .fail(function() {
        showModal({
          title: 'Could not set things up :(',
          body:  user_data.owner + '/' + user_data.repository +
              ' is not a valid public repository, or the GitHub API rate limit ' +
              'was reached. Please try again or <a href="/">check out</a> the ' +
              'existing repositories in the dashboard'
        });
        $(window).on('click', function() {
          $(window).off('click');
          toggleModal();
        });
    });
});

$('.input--owner').on('focusout', function() {
  var owner = $(this).val();
  var url = 'https://api.github.com/users/' + owner + '/repos?per_page=1000';

  if (!owner) {
    showModal({
      title: 'No username',
      body: 'You did not write a username'
    });

    $(this).focus();
    return;
  }

  user_data.owner = owner;

  $.get(url)
  .success(autocompleteRepos)
  .fail(handleFail);

});

$repo.on('keydown', function(e) {
  if (e.keyCode === 13 || e.which === 13) {
    selectedRepo($(this).val());
  }
});

function showDashboardLink() {
    $repo.typeahead('destroy');
    $('.hide-link').removeClass('hide-link');
}

function checkRepoExists(repoName) {
    var url = 'https://api.github.com/repos/' + user_data.owner + '/' + repoName;
    $.get(url).success(function () {
        user_data.repository = repoName;
        showDashboardLink();
    });
}

function selectedRepo(repoName) {

  if (!data) return; // data has not loaded just yet

  if (data.some(equal(repoName))) {
    // show dashboard link
    user_data.repository = repoName;
    showDashboardLink();
  } else {
      // might still be a good repo, just autocomplete didn't work
    checkRepoExists(repoName);
  }
}

function showRedirectModal() {
  showModal({
    title: 'Please wait while we set things up',
    body: 'We are fetching the data from ' + user_data.owner + '/' + user_data.repository +
          ' just for you! Redirecting you right away.'
  });
  $('#modal').removeClass('modal-window--error').addClass('modal-window--success');
  setTimeout(function(){
    location.href = location.origin + '/#/' + user_data.owner + '/' + user_data.repository;
  }, 3000);
}

function equal(val) {
  return function (obj) {
    return obj.name == val;
  };
}

function autocompleteRepos(d) {

  if (!d.length) {
      showModal({
        title: 'No repositories found',
        body: 'Try with a different owner or check out <a href="#">the existing repos</a> in the dashboard'
      });
      $(window).on('click', function() {
        $(window).off('click');
        toggleModal();
      });
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

function handleFail() {
  showModal({
    title: 'Could not get your repos',
    body: 'Did you type in the correct GitHub username?'
  });
  $(window).on('click', function() {
    $(window).off('click');
    toggleModal();
  });
}

function showModal(msg) {
  var $modal = $('#modal');
  $('h2', $modal).text(msg.title);
  $('p', $modal).html(msg.body);
  toggleModal();
}

function toggleModal() {
  var $modal = $('#modal');
  $modal.toggleClass('modal-window--hidden');
}

$('#close-modal').on('click', function() {
  toggleModal();
});
