/* 
 * $Source: /web/cvs/olc/webapp/styles/v2_glencoe/shared/glencoe.js,v $
 * $Revision: 1.23 $
 * $Author: mathews $
 * $Date: 2015/09/02 13:14:33 $
 * 
 * Copyright 2004 The McGraw-Hill Companies.  All Rights Reserved
 *
 * REVISION HISTORY omitted from clientside files; refer to CVS log
*/



/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Default values
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

var toolOrigin = 56;
var toolTop = 56;
var navOffset = 0;
var scrolledBy = 0;
var winWidth = 0;
var curTool="";
var floaters = new Array();
var offsetFloaters = new Array();
var toolLayers = new Array();
var curScript = "";
var nextScript = "";
var intervalID = 0;
var navIsOpen = 1;

// These are defaults; may be overridden by cookies:
var floatNav = 0;
var loggedIn = 0;
var teachersEdition=0;
var curNav="nav";
var glideSpeed="3";
var oldSitemapPage="";


/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	TEMPORARY STUFF
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/


/* gShowLayer and gHideLayer are identical to the functions in shared/common.js,
or will be someday;  I'm including them here only because the updates in shared
can't be released to novella in time for the glencoe demo.

Should replace any calls to gShow and gHide to the standard functions
after that version of common.js is released.

*/

function gShowLayer(myName) {
	var myObj = new getObj(myName);
	myObj.style.visibility="visible";
	myObj.visibility="visible";
	myObj.style.display="inline";
}

function gHideLayer(myName) {
	var myObj = new getObj(myName);
	myObj.style.visibility="hidden";
	myObj.style.display="none";
}


/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Init and Page monitor
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function PageLoad() {
	// use this for functions that should be run exactly once per page.
	overwriteFooterText();
	// Is the cookiejar too full?
	eatCookies();

	loadOlcCookie(document.forms.dataContainer.isbn.value);
	
	updateForms();
	if (getCookie("olcnav")) {
		navIsOpen = getCookie("olcnav");
	}
	InitLayers();
	hideTools();
	
	// show the proper sitemap page, if that's the current page:
	if (window.document.forms.hiddenSitemapData) {
		oldSitemapPage = window.document.forms.hiddenSitemapData.firstResourceLayer.value;
		startSiteMap();
	}

	// show any necessary alerts from the login or prefs systems:
	showSMSalerts(); 

	// start the page monitor...
if (intervalID == 0) {
		intervalID = setInterval("Monitor()",20);
	}
	pageHasLoaded = 1;
}

function InitLayers() {
	// This function is called often; for functions that should be called
	// only on the initial page load, use PageLoad() instead.

	// log the window width to trap resizes consistently:
	winWidth = getWindowWidth();

	if (floatNav == 1) {
		floaters = ["toolbar","toolbarNologin"];
		offsetFloaters = [];
	} else if (floatNav == 2) {
		floaters = ["toolbar","toolbarNologin"];
		offsetFloaters = ["nav","navTE","navClosed","navClosedTE"];
	}

	// need to be able to move these offscreen immediately after page load.
	// Not all of these will be included in all sites, so test for the presence of each before 
	// trying to use them.
	toolLayers = ["toolLogin","toolPrefs","toolSearch"];
	
	curNav = (teachersEdition == 1) ? "navTE" : "nav" ;



	// align toolbars to screen right:
	var newLeft = (getWindowWidth() > 475) ? getWindowWidth()-275 : 200;
	showToolbar();
	showNav();
}

function showNav() {
	var x = "nav";
	if (navIsOpen == 0) { 
		x = x + "Closed" 
		setTop("nav",-1000);
		setTop("navTE",-1000);
	};
	if (teachersEdition == 1) { x = x + "TE" };
	hideLayer("nav");
	hideLayer("navTE");
	hideLayer("navClosed");
	hideLayer("navClosedTE");
	showLayer(x);
}

/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   DHTML scripts
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function stopNav(myName) {
	navIsOpen = 0;
	setSessionCookie("olcnav","0");
	showNav();
}

function startNav() {
	navIsOpen = 1;
	setTop(curNav, toolTop+navOffset);
	setSessionCookie("olcnav","1");
	showNav();
}

function eatCookies() {
	// check to see if there are too many cookies on this domain; if so, eat some.
	var allCookies = document.cookie.split("; ");
	if (allCookies.length > 17) {
		var theUrl = "https://highered.mheducation.com/olcweb/styles/shared/eatcookies.html?" + document.forms.dataContainer.isbn.value;
		window.open(theUrl,"eatCookies","width=300,height=400,resizable,scrollbars");
	}
}


function Monitor() {
	// This script runs continuously, checking for changed window state (scroll, size)
	// and handling the drawer animations.
	
	// Originally had the drawers using their own setIntervals, but Opera on Windows
	// doesn't handle that very well. (memory problems, I think.)
	
	// check for window resize:
	if (winWidth != getWindowWidth()) InitLayers();
	
	// check for window scroll:
	if (typeof(window.pageYOffset) != "undefined") {
		// Netscape 4; must check this first or else N7 gets lost
		if (window.pageYOffset != scrolledBy) {
			scrolledBy = window.pageYOffset;
			floatNav == 1 ? doFloatToolbarOnly() : doFloat();
		}
	} else if (typeof(document.body) != "undefined") {
		if (typeof(document.body.scrollTop) != "undefined") {
			// IE, Mozilla
			if (document.body.scrollTop != scrolledBy) {
				scrolledBy = document.body.scrollTop;
				floatNav == 1 ? doFloatToolbarOnly() : doFloat();
			}
		} else {
			// Opera:  body.scrollTop should work, but doesn't...?
			// try to fix this... this is the only reason floating doesn't
			// work in opera right now.
			scrolledBy=0;
		}
	} else {
		// unknown, noncompliant browser
		scrolledBy = 0;
	}
	
	// run any ongoing scripts:
	if (curScript) {
		eval(curScript);
	}
	return true;
}

/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   DHTML functions
   See also startNav() and stopNav() in *dhtml.js
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function glideIn(myName, stopPos, whenDone) {
	var curTop = getTop(myName);
	if (curTop >= stopPos) {
		// stop the animation
		setTop(myName, stopPos);
		
		// workaround for a browser-specific visual glitch:
		if (navigator.appName.indexOf("Netscape") != -1 && parseInt(navigator.appVersion) == 4) {
			hideLayer(myName);
			window.setTimeout("showLayer('"+myName+"');",5);
		}

		if (whenDone) eval(whenDone);
		curScript = nextScript; 
		nextScript = "";
	} else {
		// Netscape 6 is way slow... so we bump its speed up.
		if (browserIs.ns && (browserIs.major == 6)) {
			var newTop = (glideSpeed > 0) ? Math.ceil(curTop + ((stopPos-curTop) / (glideSpeed / 2))) + 1 : stopPos;
		} else {
			var newTop = (glideSpeed > 0) ? Math.ceil(curTop + ((stopPos-curTop) / (glideSpeed * 4))) + 1 : stopPos;
		}
		setTop(myName, newTop);
	}
}

function glideOut(myName, startPos, whenDone) {
	var curTop = getTop(myName);
	if (curTop <= -1000) {
		// stop the animation
		hideLayer(myName);
		setZindex(myName, 6);
		if (whenDone) eval(whenDone);
		curScript = nextScript;
		nextScript = ""; 
	} else {
		// Netscape 6 is way slow... so we bump its speed up.
		if (browserIs.ns && (browserIs.major == 6)) {
			var newTop = (glideSpeed > 0) ? Math.ceil(curTop - ((startPos-curTop) / (glideSpeed / 4))) - 1 : -1000;
		} else {
			var newTop = (glideSpeed > 0) ? Math.ceil(curTop - ((startPos-curTop) / (glideSpeed * 2))) - 1 : -1000;
		}
		setTop(myName, newTop);
	}
}


function startAnimation(newAnim) {
	if (curScript == "") {
		curScript = newAnim;
	} else {
		nextScript = newAnim;
	}
}

function startUser() {
	if (loggedIn == 1) {
		startTool("toolProfile");
	} else {
		startTool("toolLogin");
	}
}

function checkForcedLogin(theUrl, theTarget) {

	if (loggedIn == 1) {
		if (theTarget) {
			window.open(theUrl, theTarget, "toolbar=yes,location=yes,scrollbars=yes");
		} else {
			// window.location.href=theUrl;
			// For some reason the above fails in IE/Win.  This works, though:
			setTimeout("window.location='"+theUrl+"';",10);
		}
	} else {
		// pass the desired URL into the login form:
		document.forms.loginForm.goto_url.value = theUrl;
		if (curTool != "toolLogin") {
			stopTool(); // just in case
			startTool("toolLogin");
		}
	} 
}

function startTool(myName) {
	if (curTool != "") stopTool();
	setTop(myName,-1000);
	setZindex(myName, 7);
	showLayer(myName);
	curTool=myName;
	startAnimation("glideIn('"+myName+"', toolTop,'');");
}

function stopTool(whichTool) {
	// disabled: eRights takes care of this for us
	// need to prevent closing it if we're on a locked page and not logged in.
	//if ((whichTool == 'toolLoginForced') && (isLocked == 1) && (loggedIn == 0)) {
	//	alert("Sorry; you must log in before you can close the drawer on this page.");
	//} else {
		if (curTool != "") startAnimation("glideOut('"+curTool+"',toolTop,'');");
		curTool = "";
	//}
}

function swapNav(newNav) {
	if ((teachersEdition == 0) && (newNav == "navInstructor")) {
		alert("You must be logged in as an instructor to see the Instructor Resources.");
	} else {
		if ((newNav == "nav") && (teachersEdition == 1)) {
			newNav = "navTE";
		}
		showLayer(newNav);
		hideLayer(curNav);
		curNav = newNav;
		setSessionCookie("olcnav",curNav);
	}
}

function hideTools() {
	for (i in toolLayers) {
		if (getObj(toolLayers[i])) {
			setTop(toolLayers[i], -1000);
		}
	}
}

function doFloat() {
	if (floatNav > 0) {
		toolTop = (scrolledBy > toolOrigin) ? scrolledBy : toolOrigin;
	} else {
		toolTop = toolOrigin;
	}
	showToolbar();

	for (i in floaters) {
		setTop(floaters[i], toolTop);
	}
	for (i in offsetFloaters) {
		setTop(offsetFloaters[i], toolTop+navOffset);
	}

	setTop(curTool, toolTop);
}

function doNoFloat() {
	toolTop = (scrolledBy > toolOrigin) ? scrolledBy : toolOrigin;
	showToolbar();
	// now move everything else
	for (i in floaters) {
		setTop(floaters[i], toolTop);
	}
	for (i in offsetFloaters) {
		setTop(offsetFloaters[i], toolTop+navOffset);
	}
}

function doFloatToolbarOnly() {
	toolTop = (scrolledBy > toolOrigin) ? scrolledBy : toolOrigin;
	if ((scrolledBy > toolOrigin) && (curTool == "")) {
		var theTool = showToolbar();
		setTop(theTool, -100);
		startAnimation("glideIn('"+theTool+"',toolTop,'');");
	} else {
		doFloat();
	}
}

function showToolbar() {
	var theBar = (loggedIn == 1) ? "toolbar" : "toolbarNologin" ;

	hideLayer("toolbar");
	hideLayer("toolbarNologin");
	showLayer(theBar);
	return theBar;
}

/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Cookies and Login
   See also validateStudyPlan() in powertextdhtml.js
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function validateLogin(isForced) {
	// check cookies first:
	testcookie = setCookie('test','Chocolate Chip');
	testget = getCookie('test');
	if (testget != 'Chocolate Chip') {
		alert("You must enable cookies in your browser to log in to this site.");
		return false;
	}
	deleteCookie('test');

	var f = document.forms.loginForm;
	
	/* The onChange handlers on username and password don't always get triggered 
	   (safari blocks it on the password field, and IE and mozilla auto-complete can cause problems)
	   so we duplicate them here:
	*/
	
	if (isEmpty(f.email.value)) {
		f.email.value = window.document.forms.frmLogin.email.value;
	}
	if (isEmpty(f.password.value)) {
		f.password.value = window.document.forms.frmLogin.password.value;
	}
	
	if (isForced == "") {f.goto_url = document.location.href};
	
	if (isEmpty(f.email.value) || isEmpty(f.password.value)) {
		alert("Please enter a username and password.");
		return false;
	} else {
		stopTool();
		document.forms.loginForm.submit();
	}
}

function validatePrefs(f) {
	
	var errstring = "";
	
	/* can't edit this value anymore
	if (f.myEmail) {
		if (!(isEmail(f.myEmail.value)) && (f.myEmail.value != "")) {
			errstring += "The email address you entered is invalid.\r";
		}
	}
	*/
	if (f.prof_email) {
		if (!(isEmail(f.prof_email.value)) && (f.prof_email.value != "")) {
			errstring += "The instructor email address you entered is invalid.\n";
		}
	}
	if (f.ta_email) {
		if (!(isEmail(f.ta_email.value)) && (f.ta_email.value != "")) {
			errstring += "The TA email address you entered is invalid.\n";
		}
	}
	if (f.other_email) {
		if (!(isEmail(f.other_email.value)) && (f.other_email.value != "")) {
			errstring += "The 'other' email address you entered is invalid.\n";
		}
	}

	if (errstring == "") {
		//window.open("","prefsWin","width=300,height=100,toolbar=no,status=no,scrollbars=no,location=no");
		stopTool();
		//needPrefsUpdate=1;  
		return true;
	} else {
		alert(errstring);
		return false;
	}
}

function doLogout() {
	// clear the login cookie, and reset any prefs
	// SMS is supposed to delete the cookie on its own, but apparently sometimes it fails. So we'll try again here:
	
	deleteCookie("OLC" + window.document.forms.dataContainer.isbn.value);
	deleteCookie("NOLOGIN" + window.document.forms.dataContainer.isbn.value);
	deleteCookie("OLCGroup");

	/* 
	Removing the alert, since even if the cookie is still present, the user still isn't logged in (see loadOlcCookie().)
	Worst thing that can happen is that the software keeps trying and failing to delete the cookie; no big deal.
	
	if (getCookie("OLC" + window.document.forms.dataContainer.isbn.value) || getCookie("olcGroup")) {
		alert("We're sorry, but the web browser you are using does not clear your user data on logout. Quit the program to log out.");
	}
	*/
}


/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Cookies specifically relating to 2003 OLC's
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/


function loadOlcCookie(isbn) {

	var cookieName = "";
	if (getCookie("OLCGroup")) {
		cookieName="OLCGroup"
		loggedIn=1;
	} else if (getCookie("OLC" + isbn)) {
		cookieName="OLC" + isbn;
		loggedIn=1;
	} else if (getCookie("NOLOGIN" + isbn)) {
		cookieName="NOLOGIN" + isbn;
		loggedIn=0;
	}
	if (getCookie(cookieName)) {
		if (getCookie(cookieName) == "expire") {
			// kludge, in case server didn't manage to expire the cookie
			doLogout();
		} else {
			var f = window.document.forms.dataContainer;
			
			// Admin account doesn't set all values; need to fill them in here.
			if (cookieName == "OLCGroup" && getCookieVal(cookieName, 'myEmail') == "") {
				f.firstName.value = "Admin";
				f.lastName.value = "User";
				f.myEmail.value = "Administrator";
			} else {
				f.firstName.value 	= getCookieVal(cookieName, 'firstName');
				f.lastName.value 	= getCookieVal(cookieName, 'lastName');
				f.myEmail.value 	= getCookieVal(cookieName, 'myEmail'); // This is the user's unique ID
			}

			f.MI.value 			= getCookieVal(cookieName, 'MI');
			f.profEmail.value 	= getCookieVal(cookieName, 'profEmail');
			f.taEmail.value 	= getCookieVal(cookieName, 'taEmail');
			f.otherEmail.value 	= getCookieVal(cookieName, 'otherEmail');
			f.myStyle.value 	= getCookieVal(cookieName, 'myStyle');
			f.profStyle.value 	= getCookieVal(cookieName, 'profStyle');
			f.taStyle.value 	= getCookieVal(cookieName, 'taStyle');
			f.otherStyle.value 	= getCookieVal(cookieName, 'otherStyle');
//			f.classroom.value	= getCookieVal(cookieName, 'classroom');
			floatNav 			= getCookieVal(cookieName, 'floatNav') ? getCookieVal(cookieName, 'floatNav') : 0;
			glideSpeed 			= getCookieVal(cookieName, 'glide') ? getCookieVal(cookieName, 'glide') : 3;
			teachersEdition		= getCookieVal(cookieName, 'isProf');
		}
	}
}


function showSMSalerts() {
	if (getQueryVal('SMS_ERRNO') > 0) {
		// there was an error; find out what it was:
		var errorMessage = "";
		if (getQueryVal('SMS_SERVICE') == "0") {
			// login
			if (getQueryVal('SMS_ERRNO') == "1") {
				stopTool();
				startTool("toolLogin");
				errorMessage = "The username and password you entered were not correct.";
			} else if (getQueryVal('SMS_ERRNO') == "2") {
				errorMessage = "The account you selected is already logged in.";
			} else if (getQueryVal('SMS_ERRNO') == "3") {
				errorMessage = "There was an unrecoverable error during login.";
			}else if (getQueryVal('SMS_ERRNO') == "4") {
				stopTool();
				startTool("toolLogin");
				errorMessage = "This username and password are not valid for the current site.";
			} else if (getQueryVal('SMS_ERRNO') == "5") {
				errorMessage = "The username doesn't match the current site.";
			}
		} else if (getQueryVal('SMS_SERVICE' == "1")) {
			// edit prefs
			if (getQueryVal('SMS_ERRNO') == "1") {
				errorMessage = "You are not logged in.";
			} else if (getQueryVal('SMS_ERRNO') == "2") {
				errorMessage = "There was an unrecoverable error while trying to save your preferences.";
			}
		}
		if (errorMessage == "") {
			errorMessage = "There was an unexpected error: SERVICE='" + getQueryVal('SMS_SERVICE') + "', ERRNO='" + getQueryVal('SMS_ERRNO') + "'.";
		}
		alert(errorMessage);
	}
}

/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Preferences (OLC-specific)
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function updateForms() {
	/*
	Copies data into all the various forms that may be present.
	We can always depend on forms.dataContainer to be present... 
	the others may or may not be on every page.

	There are different sets of variable names here, which is messy... but it's
	easier to do this than it would be to start
	screwing with the 'mail your results' scripts.
	*/

	var g = window.document.forms.dataContainer;
	for (i=0; i<document.forms.length;i++) {
		var f = document.forms[i];

		if (f.name == "frmMail") {
			// have to use the old variable names here, for compatibility with old scripts
			if (f.txtName) {
				// changing this so it will function if any of the name fields are filled
				var mergedName = "";
				if (g.lastName.value) {
					mergedName = g.lastName.value;
				}
				if (g.MI.value) {
					mergedName = g.MI.value + " " + mergedName;
				}
				if (g.firstName.value) {
					mergedName = g.firstName.value + " " + mergedName;
				}
				f.txtName.value = mergedName;
			}
			if (f.txtMyEmailId && g.myEmail.value && (g.myEmail.value != "Administrator")) {
				f.txtMyEmailId.value = g.myEmail.value;
			}
			if (f.txtInstEmailId && g.profEmail.value) {
				f.txtInstEmailId.value = g.profEmail.value;
			}
			if (f.txtTAEmailId && g.taEmail.value) {
				f.txtTAEmailId.value = g.taEmail.value;
			}
			if (f.txtOtherEmailId && g.otherEmail.value) {
				f.txtOtherEmailId.value = g.otherEmail.value;
			}
			if (f.cboMyOption) {
				f.cboMyOption.selectedIndex = g.myStyle.value;
			}
			if (f.cboInstOption) {
				f.cboInstOption.selectedIndex = g.profStyle.value;
			}
			if (f.cboTAOption) {
				f.cboTAOption.selectedIndex = g.taStyle.value;
			}
			if (f.cboOtherOption) {
				f.cboOtherOption.selectedIndex = g.otherStyle.value;
			}

		} else if (f.name == "frmPrefs" || f.name == "frmPrefsProf") {
			/*
			if (f.firstName && g.firstName.value) {
				f.firstName.value = g.firstName.value;
			}
			if (f.MI && g.MI.value) {
				f.MI.value = g.MI.value;
			}
			if (f.lastName && g.lastName.value) {
				f.lastName.value = g.lastName.value;
			}
			if (f.my_email && g.myEmail.value) {
				f.my_email.value = g.myEmail.value;
			}
			*/
			if (f.prof_email && g.profEmail.value) {
				f.prof_email.value = g.profEmail.value;
			}
			if (f.ta_email && g.taEmail.value) {
				f.ta_email.value = g.taEmail.value;
			}
			if (f.other_email && g.otherEmail.value) {
				f.other_email.value = g.otherEmail.value;
			}
			if (f.email_style) {
				f.email_style.selectedIndex = g.myStyle.value;
			}
			if (f.prof_email_style) {
				f.prof_email_style.selectedIndex = g.profStyle.value;
			}
			if (f.ta_email_style) {
				f.ta_email_style.selectedIndex = g.taStyle.value;
			}
			if (f.other_email_style) {
				f.other_email_style.selectedIndex = g.otherStyle.value;
			}
			if (f.float_nav) {
				f.float_nav.selectedIndex = floatNav;
			}
			if (f.drawer_speed) {
				f.drawer_speed.selectedIndex = glideSpeed;
			}
//			if (f.classroom && g.classroom.value) {
//				f.classroom.value = g.classroom.value;
//			}
		} else if (f.name == "hiddenNotes") {
			if (g.myEmail.value) {
				f.user_id.value = g.myEmail.value;
			}
//			if (g.classroom.value) {
//				f.classroom.value = g.classroom.value;
//			}
		}
	}
}

/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Quiz Mailform verifiers
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function onSurveyEmailSubmit() {
	var s1 = document.forms.frmMail.txtName.value;
	var s2 = document.forms.frmMail.txtMyEmailId.value;
	if (isEmpty(s1)) {
		alert("You must enter your name.");
		document.forms.frmMail.txtName.focus();
	} else if (!isEmail(s2)) {
		alert("You must enter a valid e-mail address.");
		document.forms.frmMail.txtMyEmailId.focus();
	} else {
		document.forms.frmMail.submit();
	}
}

function onPollEmailSubmit() {
	if (validateMailFormFields()) {
	      document.forms.frmMail.submit();
	}
}

function onEmailSubmit(){	
	var f = document.forms.frmMail;
	var se = convertSpaces(f.sectionid.value);
	var s1 = convertSpaces(f.txtName.value);
	var s2 = f.txtMyEmailId.value;
	var s3 = f.txtInstEmailId.value;
	var s4 = f.txtTAEmailId.value;
	var s5 = f.txtOtherEmailId.value;
	var contentId = f.contentid.value;
	var quizType = f.TypeOfQuiz.value;
	var html = f.htmlEmail.value;
	var o1 = (f.cboMyOption.selectedIndex) ? f.cboMyOption[f.cboMyOption.selectedIndex].value : f.cboMyOption.value ;
	var o2 = (f.cboInstOption.selectedIndex) ? f.cboInstOption[f.cboInstOption.selectedIndex].value : f.cboInstOption.value ;
	var o3 = (f.cboTAOption.selectedIndex) ? f.cboTAOption[f.cboTAOption.selectedIndex].value : f.cboTAOption.value ;
	var o4 = (f.cboOtherOption.selectedIndex) ? f.cboOtherOption[f.cboOtherOption.selectedIndex].value : f.cboOtherOption.value ;
/*
	var o1 = (f.cboMyOption.selectedIndex == 0) ? "html" : "text" ;
	var o2 = (f.cboInstOption.selectedIndex == 0) ? "html" : "text" ;
	var o4 = (f.cboOtherOption.selectedIndex == 0) ? "html" : "text" ;
*/
var qType = 0;

	for (i=0; i<this.document.forms.length; i++) {
		var ff = this.document.forms[i];
		var eL = ff.elements.length;
		for (j=0; j<eL; j++) {
			var eN = ff.elements[j].name;
			if (eN == "TypeOfQuiz") {
				qType = ff.elements[j].value;
				break;
			}
		}
		//http://novellaqastaging.mhhe.com/sites/1820331000/student_view0/unit1/multiple_choice_quiz.html
	}
//no section id for glencoe
	if (validateMailFormFields()){
		var URL = "/novella/ClientSideResultsMailingServlet?sectionId=";		
		URL += "&contentid="+contentId;
		URL += "&TypeofQuiz="+quizType;
		if (!isEmpty(s1)) URL += "&studentName="+s1;
		if (!isEmpty(s2)) {URL += "&studentEmail="+s2+"&studentEmailFormat="+o1;};
		if (!isEmpty(s3)) {URL += "&instructorEmail="+s3+"&instructorEmailFormat="+o2;};
		if (!isEmpty(s4)) {URL += "&taEmail="+s4+"&taEmailFormat="+o3;};
		if (!isEmpty(s5)) {URL += "&otherEmail="+s5+"&otherEmailFormat="+o4;};		
		if ((qType == 5) || (qType == 3) || (qType == 1)) {//changed this to allow submission for TF,MR and Essay
			f.action = URL;
			f.target = "_new";
			f.submit();
			
		} else {
			window.open(URL,'popup','toolbar=no,scrollbar=no,width=300,height=100');
		}
	}
}

function onMixedQuizEmailSubmit(){	
	var f = document.forms.frmMail;
	var se = convertSpaces(f.sectionid.value);
	var s1 = convertSpaces(f.txtName.value);
	var s2 = f.txtMyEmailId.value;
	var s3 = f.txtInstEmailId.value;
	var s4 = f.txtTAEmailId.value;
	var s5 = f.txtOtherEmailId.value;
	
	var o1 = (f.cboMyOption.selectedIndex) ? f.cboMyOption[f.cboMyOption.selectedIndex].value : f.cboMyOption.value ;
	var o2 = (f.cboInstOption.selectedIndex) ? f.cboInstOption[f.cboInstOption.selectedIndex].value : f.cboInstOption.value ;
	var o3 = (f.cboTAOption.selectedIndex) ? f.cboTAOption[f.cboTAOption.selectedIndex].value : f.cboTAOption.value ;
	var o4 = (f.cboOtherOption.selectedIndex) ? f.cboOtherOption[f.cboOtherOption.selectedIndex].value : f.cboOtherOption.value ;
/*
	var o1 = (f.cboMyOption.selectedIndex == 0) ? "html" : "text" ;
	var o2 = (f.cboInstOption.selectedIndex == 0) ? "html" : "text" ;
	var o4 = (f.cboOtherOption.selectedIndex == 0) ? "html" : "text" ;
*/
var qType = 0;

	for (i=0; i<this.document.forms.length; i++) {
		var ff = this.document.forms[i];
		var eL = ff.elements.length;
		for (j=0; j<eL; j++) {
			var eN = ff.elements[j].name;
			if (eN == "TypeOfQuiz") {
				qType = ff.elements[j].value;
				break;
			}
		}
		//http://novellaqastaging.mhhe.com/sites/1820331000/student_view0/unit1/multiple_choice_quiz.html
	}
//no section id for glencoe
	if (validateMailFormFields()){
		var URL = "/novella/MailServlet?";
		if (!isEmpty(se)) URL += "sectionid="+sectionId;
		if (!isEmpty(s1)) URL += "&studentName="+s1;
		if (!isEmpty(s2)) {URL += "&studentEmail="+s2+"&studentEmailFormat="+o1;};
		if (!isEmpty(s3)) {URL += "&instructorEmail="+s3+"&instructorEmailFormat="+o2;};
		if (!isEmpty(s4)) {URL += "&taEmail="+s4+"&taEmailFormat="+o3;};
		if (!isEmpty(s5)) {URL += "&otherEmail="+s5+"&otherEmailFormat="+o4;};
		if (qType == 5) {
			f.action = URL;
			f.target = "_new";
			f.submit();
		} else {
			window.open(URL,'popup','toolbar=no,scrollbar=no,width=300,height=100');
		}
	}
}

function validateMailFormFields() {
	var f = document.forms.frmMail;
	var strRequired = "";
	var strEmailError = "";
	var s1 = f.txtName.value;
	var s2 = f.txtMyEmailId.value;
	var s3 = f.txtInstEmailId.value;
	var s4 = f.txtTAEmailId.value;
	var s5 = f.txtOtherEmailId.value;

	if (isEmpty(s1)) {
		strRequired = strRequired + "MYNAME";
		f.txtName.focus();
	}
	else if (isEmpty(s2)) {
		strRequired = strRequired + "MYEMAILID";
		f.txtMyEmailId.focus();
	}
	else if (!isEmail(s2)) {
		strEmailError += "YOUREMAILID";
		f.txtMyEmailId.focus();
	}
	else if (!isEmpty(s3) && !isEmail(s3)) {
		strEmailError += "INSTEMAILID";
		f.txtInstEmailId.focus();
	}
	else if (!isEmpty(s4) && !isEmail(s4)) {
		strEmailError += "TAEMAILID";
		f.txtTAEmailId.focus();
	}
	else if (!isEmpty(s5) && !isEmail(s5)) {
		strEmailError += "OTHEREMAILID";
		f.txtOtherEmailId.focus();
	}
	if (!isEmpty(strRequired)) {
		alert("Please enter your name and email address.");
		return false;
	}
	else if(!isEmpty(strEmailError)) {
		alert("Please enter a correct email address.");
		return false;
	}
	else return true;
}





/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Notes
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function ns4noteCheck(theEl) {
	// another joyous workaround for netscape four.
	if (browserIs.ns && browserIs.major == 4) {
		alert("We're sorry, but Netscape 4 does not allow highlighting text.");
		theEl.selectedIndex = 0;
	} 
}

function captureSelectedText(isOnSubmit) {
	// netscape 4 never triggers this function. (onMouseDown isn't recognized???)

	var theSelectedText = "";
	if (window.getSelection) {
		// NS 7
		theSelectedText = window.getSelection();
	} else if (document.getSelection) {
		// IE
		theSelectedText = document.getSelection();
	} else if (document.selection && document.selection.createRange) {
		// other IE
		var range = document.selection.createRange();
		theSelectedText = range.text;
	} else {
		//bad browser. No donut.
		theSelectedText = ' ';
	}

	// fill the value in, unless it was captured when the drawer was opened:
	if (isOnSubmit) {
		if (theSelectedText != '') {
			document.forms.hiddenNotes.theText.value = theSelectedText;
		}
	} else {
		document.forms.hiddenNotes.theText.value = theSelectedText;
	}
}

function submitNewNote() {
	if (getCookie("OLCGroup")) {
		// quick, dirty, and drubk
		alert("You are using a shared account, so cannot save notes.");
		stopTool();
	} else {
	
		var f = document.forms.hiddenNotes;
		
		// to save a note, must either have entered some note text, or 
		// selected a highlight color and captured some text.
		if (
			((f.theNote.value != null) && (f.theNote.value != "")) ||
			(
				((f.theHighlight.value != null) && (f.theHighlight.value != "")) &&
				((f.theText.value != null) && (f.theText.value != ""))
			)
		) {
			if (isDynamic == 1) {
				document.forms.hiddenNotes.isDynamic.value = 1;
			}
			document.forms.hiddenNotes.action="https://highered.mheducation.com/olcweb/notes/newnote.cgi";
			document.forms.hiddenNotes.target="notePopup";
			window.open('','notePopup','toolbar=no,scrollbar=no,width=300,height=150');
			// alert(f.user_id.value);
			document.forms.hiddenNotes.submit();
			
			stopTool();
		} else {
			alert("You must either choose a highlight color and select some text to highlight, or enter some note text above.");
			return false;
		}
	}
}

function clearNotesForm(theForm) {
	// necessary to avoid NS4 layer problems:
	theForm.newnotes.value="";
	theForm.highlighter.selectedIndex=0;
//	theForm.shared.checked="false";
	return false; // don't actually want to submit this form.
}

function shareNotes(theElement) {
/*
	if (teachersEdition == 1) {
		document.forms.hiddenNotes.isShared.value = theElement.checked;
	} else {
		alert("Sorry, only instructors are allowed to share notes.");
		theElement.checked = false;
	}
*/
}

function showNotes() {
	document.forms.hiddenNotes.action="https://highered.mheducation.com/olcweb/notes/parsepage.cgi";
	document.forms.hiddenNotes.target="_self";
	document.forms.hiddenNotes.user_id.value = window.document.forms.dataContainer.myEmail.value;
	stopTool();
	document.forms.hiddenNotes.submit();
}

function searchNotes() {
	document.forms.hiddenNotes.action="https://highered.mheducation.com/olcweb/notes/search.cgi";
	document.forms.hiddenNotes.target="notePopup";
	document.forms.hiddenNotes.user_id.value = window.document.forms.dataContainer.myEmail.value;
	window.open('','notePopup','toolbar=no,scrollbar=yes,width=300,height=450');
	stopTool();
	document.forms.hiddenNotes.submit();
}

function removeNote(theNote) {
	if ((teachersEdition == 0) && (theNote.charAt(0) == "c")) {
		alert("Sorry, only instructors may delete shared notes.");
	} else {
		if (confirm("Are you sure you want to delete this note?")) {
			document.forms.deleteNote.thenote.value = theNote;
			window.open('','notePopup','toolbar=no,scrollbar=yes,width=300,height=150');
			document.forms.deleteNote.submit();
		}
	}
} 

function showNote(theNote) {
	var myY = (browserIs.mac && browserIs.ie) ? (mouseY-100) : mouseY ;
	var myX = (mouseX > (getWindowWidth()-200)) ? (mouseX-150) : mouseX ;
	setTop(theNote, myY);
	setLeft(theNote,myX);
	showLayer(theNote);
}

function hideNote(theNote) {
	setTop(theNote, -1000);
	hideLayer(theNote);
}


/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Search
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function doSearch(sourceForm) {
	var f;
	if (sourceForm.searchType.value == "1") {
		// Modified for Factiva search:
		f = document.forms.nlSearch;
		if (f.qr) {
			f.qr.value = sourceForm.QueryText.value;
		}
		if (f.QueryText) {
			f.QueryText.value = sourceForm.QueryText.value;
		}
	} else {
		// Verity search:
		f = document.forms.veritySearch;
		// needs to differentiate between student and instructor editions.
		if (teachersEdition == 1) {
			f.SourceQueryText.value = "ISBN=" + window.document.forms.dataContainer.isbn.value.toLowerCase();
			
		} else {
			f.SourceQueryText.value = "ISBN=" + window.document.forms.dataContainer.isbn.value.toLowerCase() + " AND VIEWTYPE=student";
			
		}
		f.QueryText.value = sourceForm.QueryText.value;
		
	}

	if (sourceForm.QueryText.value != "") {
		f.submit();  
		stopTool();
	} else {
		alert("Please enter some text to search for.");
		if (document.forms.frmSearch) {
			document.forms.frmSearch.QueryText.focus();
		}
	}
	return false;
}

/* 
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   Set State Cookies
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

function setStateCookie(cookieName, cookieValue) {
	alert("cookiestring:" + cookieString);
	document.cookie = cookieName + ";" + cookieString + ";path=/;";
}

function fakeLogin(isbn, wantsProf) {
	/* 
		changing this, since login is now required.
	*/
	var cookieName = "NOLOGIN" + isbn;
	var cookieString = "isProf=" + wantsProf;
	setSessionCookie(cookieName, cookieString);
	//alert(document.cookie);
	//isProfVal = getCookieVal(cookieName, 'isProf');
	//alert("isProfVal" + isProfVal);
}
