// Initialize app
var myApp = new Framework7();

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var devurl="https://dev.liftedloads.com/wp-json/liftedloads/v1/sites";
var stagingurl="https://staging.liftedloads.com/wp-json/liftedloads/v1/sites";
var produrl="https://liftedloads.com/wp-json/liftedloads/v1/sites";

var url = produrl; //Change this parameter for testing and deployment

$$('.open-info').on('click', function () {
  myApp.pickerModal('.picker-info')
});
$$('.close-info').on('click', function () {
  myApp.closeModal('.picker-info')
});       


$$('.panel-close-default-reset').on('click', function (e) {
	var storedData = myApp.formDeleteData('siteform');
	myApp.closePanel();
	reloadPage();
});

$$('.panel-close-refresh').on('click', function (e) {
	myApp.closePanel();
	reloadPage();
});

function reloadPage()
{
	window.location.reload(true);
}

function promptDefault(id)
{
	var storedData = myApp.formGetData('siteform');
	if(!storedData || (storedData["site"]=="undefined")) {
		myApp.confirm('Make this the default page?', 'Lifted Loads', 
		  function () {
			var storedData = myApp.formStoreData('siteform', {
				'site': id,
			});
			reloadPage();
		  },
		  function () {
		  }
		);
	}
}


// Variables
var liftedLoads;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    //console.log("Device is ready!");
	getLiftedLoadsData();

});


var mySearchbar = myApp.searchbar('.searchbar', {
	searchList: '.list-block',
	searchIn: '.item-title'
});   


// Get REST data
function getLiftedLoadsData()
{
   
   jQuery.getJSON(url,function(result){
	liftedLoads = result;
	
	var storedData = myApp.formGetData('siteform');
	
	if(storedData && (storedData["site"]!="undefined")) {
		var id = storedData["site"];
		listProjects(id, true);
	} else {
		listSites(liftedLoads);
	}
	
   });
	   
}

//Open link using Cordova browser
function openLink(url)
{
	cordova.InAppBrowser.open('payment.html?url=' + encodeURIComponent(url), '_blank', 'location=no,hardwareback=no');
}

// Populate sites and projects
function listSites(liftedLoads)
{
	var output = '';
	
	jQuery.each(liftedLoads, function(i, field){
		output += constructSiteList(field);
	});
	jQuery('#site-list').html(output);
	jQuery('#sites-content-block-title').html('Public Sites');
}

function listProjects(id, showInIndex)
{
	var output = '';
	
	jQuery.each(liftedLoads, function(i, field){
		if (field.id == id) {
			jQuery.each(field.projects, function(i, innerfield){
				output += constructProjectList(innerfield);	
			});
			if (showInIndex) {
				jQuery('#sites-center-sliding-title').html(field.name);  
				jQuery('#sites-content-block-title').html('Projects');
				jQuery('#site-list').html(output); 
			} else {
				jQuery('#projects-center-sliding-title').html(field.name); 			
				jQuery('#project-list').html(output);  			
			}
		}
		return;
	});	 
}

// Get sites and projects
function displayProject(id)
{
	var output = '';
	
	jQuery.each(liftedLoads, function(i, field){
		jQuery.each(field.projects, function(i, innerfield){
			if (innerfield.ID == id) {
				output += constructProjectCard(innerfield);	
				jQuery('#project-center-sliding-title').html(innerfield.Name);  
			}
		});
		jQuery('#project-card').html(output);  
		return;
	});	 
}


function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function constructSiteList(field)
{
	var output = '';
	
	output += '<ul>';
	output += '<li>';
	output += '<a href="projects.html?id=' + field.id + '"  class="item-link item-content">';
	output += '<div class="item-media"><img src="' + field.logo + '" width="80"></div>';
	output += '<div class="item-inner">';
	output += '<div class="item-title-row">';
	output += '<div class="item-title">' + field.name + '</div>';
	output += '<div class="item-after"></div>';
	output += '</div>';
	output += '<div class="item-subtitle">' + field.address + '</div>';
	output += '<div class="item-text">' + field.description + '</div>';
	output += '</div>';
	output += '</a>';
	output += '</li>';
	output += '</ul>';

	return output;
}

function constructProjectList(field)
{
	var output = '';
	var createDate = new Date(field.CreationDate);
	var progressbar = '<div class="progressbar color-blue" data-progress="' + Math.min(Math.round((field.Given/field.Goal)*100), 100) + '"><span style="transform: translate3d(' + Math.min(Math.round((field.Given/field.Goal)*100 - 100), 0) + '%, 0px, 0px);"></span></div>';
	var nowDate = new Date();
	var threeDaysMilliseconds = 7 * 24 * 60 * 60 * 1000;

	if (field.IsUnlimited)
	{
		progressbar = '<div class="progressbar-infinite color-blue" data-progress="100"><span style="transform: translate3d(0%, 0px, 0px);"></span></div>';
	}
	
	output += '<ul>';
	output += '<li>';
	output += '<a href="project.html?id=' + field.ID + '" class="item-link item-content">';
	output += '<div class="item-media"><img src="' + field.Image + '" width="80"></div>';
	output += '<div class="item-inner">';
	output += '<div class="item-title-row">';
	output += '<div class="item-title">' + field.Name;
	if ((Math.abs(nowDate-createDate)) <= threeDaysMilliseconds) {
		output += ' <sup style="color: #0000ff"> new!</sup>';
	}
	if (field.DaysLeft != 'all') {
		if (field.DaysLeft.search('hour') > -1 || field.DaysLeft.search('minute') > -1 || parseInt(field.DaysLeft.split(' ')[0], 10) <= 3) {
			output += ' <i class="f7-icons" style="color: #ff0000; font-size: 18px">alarm</i>';
		}
	}
	output += '</div>';
	output += '<div class="item-after"></div>';
	output += '</div>';
	output += '<div class="item-subtitle">' + field.Content.substring(0, 100) + '...</div>';
	output += '<div class="item-subtitle">' + field.Currency + field.Given + ' given';
	if (field.DaysLeft != 'all') {
		output += ', ' + field.DaysLeft + ' to go';
	}
	output += '</div>';
	output += progressbar;
	output += '</div>';
	output += '</a>';
	output += '</li>';
	output += '</ul>';

	return output;
}

function constructProjectCard(field)
{
	var output = '';
	var giftaidtext = '';
	var requiredtext = ' out of ' + field.Currency + field.Goal + ' required';
	var progressbar = '<div class="progressbar color-blue" data-progress="' + Math.min(Math.round((field.Given/field.Goal)*100), 100) + '"><span style="transform: translate3d(' + Math.min(Math.round((field.Given/field.Goal)*100 - 100), 0) + '%, 0px, 0px);"></span></div>';
	var totaldonations = Number(field.Given) + Number(field.GivenGiftAid);
	
	var donationUrl = 'https://' + field.Domain + '/paypalap?action=go&offer_id=' + field.ID;

	if (field.GivenGiftAid > 0)
	{
		giftaidtext = '(' + field.Currency + totaldonations + ' w/ Gift Aid)';
	}
	
	if (field.IsUnlimited)
	{
		requiredtext = ' (no donation limit)';
		progressbar = '<div class="progressbar-infinite color-blue" data-progress="100"><span style="transform: translate3d(0%, 0px, 0px);"></span></div>';
	}
	
	output += '<div style="background-image:url(' + field.Image + '); height: 40vw; background-size: cover; background-position: center;" valign="bottom" class="card-header color-white no-border"></div>';
	output += '<div class="card-content">';
	output += '<div class="card-content-inner">';
	output += '<p class="color-gray" style="font-size: 8px">Posted ' + field.CreationDate + ' | Expires ' + field.Expiry +'</p>';
	output += '<p><center>' + field.Currency + field.Given + ' given ' + giftaidtext + requiredtext + '</center></p>';
	output += progressbar; 
	output += '<p><strong>Description</strong></p>';
	output += '<p>' + field.Content + '</p>';
	output += '<p><strong>Highlights</strong></p>';
	output += '<p>' + field.Highlights + '</p>';
	output += '<p><strong>Give</strong></p>';
	output += '</div>';
	output += '</div>';
	output += '<p class="buttons-row"><a href="payment.html?url=' + encodeURIComponent(donationUrl + '&amount=5') +'" class="button button-big button-raised external">' + field.Currency + '5</a><a href="payment.html?url=' + encodeURIComponent(donationUrl + '&amount=10') +'" class="button button-big button-raised external">' + field.Currency + '10</a><a href="payment.html?url=' + encodeURIComponent(donationUrl + '&amount=20') +'" class="button button-big button-raised external">' + field.Currency + '20</a></p>';
	output += '<p class="buttons-row"><a href="payment.html?url=' + encodeURIComponent(donationUrl + '&amount=30') +'" class="button button-big button-raised external">' + field.Currency + '30</a><a href="payment.html?url=' + encodeURIComponent(donationUrl + '&amount=50') +'" class="button button-big button-raised external">' + field.Currency + '50</a><a href="payment.html?url=' + encodeURIComponent(donationUrl + '&amount=100') +'" class="button button-big button-raised external">' + field.Currency + '100</a></p>';

	return output;
}

$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;
	
	if (page.name === 'projects') {
		var id = e.detail.page.query.id;
		
		var projectSearchbar = myApp.searchbar('.searchbar-projects', {
			searchList: '.project-list-block',
			searchIn: '.item-title'
		}); 
			
		listProjects(id, false);
		
		promptDefault(id);
    }
	
	if (page.name === 'project') {
		var id = e.detail.page.query.id;
				
		displayProject(id);
    }
	
	if (page.name === 'payment') {
		var url = e.detail.page.query.url;
	
		var ref = cordova.InAppBrowser.open(decodeURIComponent(url), '_blank', 'location=no,hardwareback=no');
    }
	
	if (page.name === 'index') {		
		listSites(liftedLoads);
    }
	
    if (page.name === 'about') {
        // Following code will be executed for page with data-page attribute equal to "about"
        //myApp.alert('Here comes About page');
    }
	
})


