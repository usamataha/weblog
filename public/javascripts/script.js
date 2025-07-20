/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// Event listener to the "DOMContentLoaded" event. Add all your startup logic here.
document.addEventListener("DOMContentLoaded", function() {
    // (1) If in home page, adjust the middle row columns on window resize
    if ((window.location.pathname.indexOf("/") + 1)
        % ( window.location.pathname.lastIndexOf("/") + 1 ) === 0) window.onresize = debounce(adjustHomePageWidth);

    // (2) Observe the sideBar resize event
    var sideBar = document.getElementById("sideBar");
    if (sideBar !== null) onResizeElement(sideBar, debounce(adjustHomePageWidth));

    // (3) Observe the quick search input change and fetch the fearch result from server
    menu_qSearch.addEventListener("keypress", async function inputchanged(e) {
        // Send the search string on the Enter key press
        if(e.key === "Enter") { 
            var searchString = menu_qSearch.value;
            menu_qSearch.value="";
            try {
                qSearchDlg.innerHTML = "";
                await fetch("/qsearch/" + searchString).then((response) => { 
                    response.json().then((responseData) => {
                        if (response.status !== 200) return;
                        responseData.forEach((item) => {
                            qSearchDlg.innerHTML += `<p onclick="qSearchDlg.close(); window.location.href='${item.url}/details';"><img src="${item.img}"> ${item.title}</p>`;
                        });
                        adjustqSearchDlgSize();
                        qSearchDlg.showModal();
                    });
                });
            }
            catch (error) { window.alert(error); }

        }
    });

    // (4) Observe the quick search input resize event to size and position the results dialog properly
    if (menu_qSearch !== null) onResizeElement(menu_qSearch, debounce(adjustqSearchDlgSize));

    // (5) Start the session expire time counter function
    startSessionCounter();

    // (6) Set the theme from local storage
    var theme = window.localStorage.getItem("theme");
    switch (theme) {
        case "dark":
            darkTheme();
            break;

        case "custom":
            // Reset to default values first
            lightTheme();
            window.localStorage.setItem("theme", "custom");
            var rgbShift = JSON.parse(window.localStorage.getItem("customThemeRGBShift"));
            applyTheme(rgbShift, window.localStorage.getItem("customThemeImageInvert"));
            break;

        default:
            // Reset to default value
            window.localStorage.setItem("theme", "light");
    }

    // (7) Set display language from local storage
    var language = window.localStorage.getItem("language");
    if (language !== "en") setLanguage(window.localStorage.getItem("language"));

    // (8) Page is ready. Restore the html visibility.
    document.getElementsByTagName("html")[0].style.visibility = "visible";
});

/**
 * Function to extend the current session's time.
 */
async function refreshsession() {
    // Store the session expire time if recieved from server
    try {
        await fetch("/users/refresh").then((response) => { 
            response.json().then((timerIntervalMinutes) => {
                if (!timerIntervalMinutes) return;
                var countDownDate = (new Date().getTime()) + timerIntervalMinutes * 60 * 1000;
                window.localStorage.setItem("expireDate", countDownDate);
                startSessionCounter();
            });
        });
    }
    catch (error) { window.alert(error); }
}

/**
 * Function to display the cureent session's end timer in "#session".
 * Expire date has to be stored under local storage's key, "expireDate".
 */
function startSessionCounter(){
    var sessionTimer = setInterval(function() {
        var expireDateKey= window.localStorage.getItem("expireDate");
        if (!expireDateKey) return;
        var expireDate = parseInt(expireDateKey);

        var now = new Date().getTime();
        var distance = expireDate - now;
        var hours = Math.floor((distance % (1000 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        if (distance < 0) { 
            clearInterval(sessionTimer);
            window.localStorage.removeItem("expireDate");
            session.innerText = "EXPIRED";
            return;
        }
        session.innerText = ((hours > 0)? hours + "h:" : "") +
        ((minutes > 0)? minutes + "m:" : "") +
        seconds + "s";
    }, 1000);
}

/**
 * Function to adjust the width and position of the quick search results dialog
 */
function adjustqSearchDlgSize() {
    var rect = menu_qSearch.getBoundingClientRect();

    if(document.documentElement.dir === "rtl") { qSearchDlg.style.right = (document.body.clientWidth - rect.right) + "px"; }
    else { qSearchDlg.style.left = rect.left + "px"; }
    
    qSearchDlg.style.top = rect.bottom + menu_qSearch.style.padding + qSearchDlg.style.padding + "px";
    qSearchDlg.style.width = rect.width + "px";
}

/**
 * General purpose function to work as a resize handler
 *
 * @param {elm} elm - The observed element.
 * @param {callbackFunc} callbackFunc - The resize handling function.
 */
var onResizeElement = (elm, callbackFunc) => {
    var resizeObserver = new ResizeObserver(() => callbackFunc());
    resizeObserver.observe(elm);
};

/**
 * General purpose function to debounce / delay a callBackFunction for a specified time, 1/4 sec by default
 * It will execute the callBackFunction if the delay time has passed since the last call only
 *
 * @param {callBackFunction} callBackFunction - The function to be debounced.
 * @param {delay} delay - Execution delay in milliseconds - default is 250.
 * @returns {Function} - A debounced function.
 */
var debounce = (callBackFunction, delay = 250) => {
    var debounceTimer;                  // Create timer
    // Return an anonymous function
    return function () {
        clearTimeout(debounceTimer);    // Clear previous timer
        // Call the delayed function
        debounceTimer = setTimeout(() => { callBackFunction(); }, delay);
    };
};

// open side tabs
function openTab(sender, tabName) {

    var sideBar =  document.getElementById("sideBar");
    var sideBarWidth;
    // sideBar is intialized with 0% width. Give it the right width.
    if (sideBar.style.width == "0%" || sideBar.style.width == "") { sideBarWidth = "var(--sidebarWidth)"; }

    var allActiveTabBtns = document.getElementsByClassName("quickAccessBtnActive");
    var allTabs = document.getElementsByName("sideTab");
    var currentTab = document.getElementById(tabName);
    // Deavtivate the selected tab if already active
    if (sender.currentTarget.className == "quickAccessBtnActive"){
        sender.currentTarget.className = "quickAccessBtn";
        currentTab.style.display = "none";
        sideBar.style.width = "0%";
    }
    // Deactivate all, then activate the selected tab.
    else {
        for (let i = 0; i < allTabs.length; i++){ allTabs[i].style.display = "none"; }
        for (let i = 0; i < allActiveTabBtns.length; i++){ allActiveTabBtns[i].className = "quickAccessBtn"; }
        sender.currentTarget.className = "quickAccessBtnActive";
        currentTab.style.display = "block";
        sideBar.style.width = sideBarWidth;
    }
    // Adjust columns
    debounce(adjustHomePageWidth);
}

// Adjust middle row's columns
function adjustHomePageWidth() {
    var quickAccessWidth =  document.getElementById("quickAccess").offsetWidth;
    var sideBarWidth =  document.getElementById("sideBar").offsetWidth;
    var remainingWidth = window.innerWidth - sideBarWidth - quickAccessWidth;

    document.getElementById("homePage").style.gridTemplateColumns = 
    `${quickAccessWidth}px ${sideBarWidth}px ${remainingWidth}px`;
}

/**
 * General purpose function asks for confirmation before redirecting to a certain destination.
 * @param {url} url - a hyperlink. destination url.
 * @param {prompt} prompt - (optional) string the confirmation message.
 */
function confirmRedirect(url, prompt = "Are you sure you want to continue?!") {
    if (confirm(prompt) === true) window.location.href = url;
}


/**
 * General purpose function to set elemnts' visibility style to "hidden" reseting their values 
 * @param {name} name - string. the elements name.
 */
function hideElements(name) { 
    var elements = document.getElementsByName(name);
    for (let i = 0; i < elements.length; i++) { 
        elements[i].style.visibility = "hidden";
        elements[i].value = ""; 
    }
}

/**
 * General purpose function to restore elemnts' visibility style to "visible"
 * @param {name} name - string. the elements name.
 */
function showElements(name) { 
    var elements = document.getElementsByName(name);
    for (let i = 0; i < elements.length; i++) { elements[i].style.visibility = "visible"; }
}

/**
 * Function to return search results from server using fetch method to avoid reloading
 * @param {event} event - the event used to trigger the function. It's default will be suppressed
 * @param {sender} sender - the form that sent the search data.
 * @param {resultsContainer} resultsContainer - The DIV to hold the search results.
 */
async function displaySearchResults(event, sender, resultsContainer) {
    event.preventDefault();
    var formData = new FormData(sender);
    resultsContainer.innerHTML = "";
    try {
        await fetch( sender.action,
            { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, 
                body: new URLSearchParams(formData) }).then((response) => { 
                    response.json().then((responseData) => { 
                        if (response.status !== 200) {
                            resultsContainer.innerHTML = `Response status: ${response.status}.\r\n${responseData}`;
                            return;
                        }
                        responseData.forEach((item) => { resultsContainer.innerHTML +=
                            `<p><a href="${item.url}/details" title="${item.type}">${item.title}</a></p>`; 
                        }); 
                    }); 
                }); 
        }
    catch (error) { window.alert(error); } 
}

/**
 * Function to return login response from server using fetch method to avoid reloading
 * @param {event} event - the event used to trigger the function. It's default will be suppressed
 * @param {sender} sender - the form that sent the search data.
 */
async function userLogin(event, sender) {
    event.preventDefault();
    var formData = new FormData(sender);
    try {
        await fetch(sender.action,
            { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, 
                body: new URLSearchParams(formData) }).then((response) => { 
                    if (response.status !== 200) {
                        window.alert(`Error! Response status: ${response.status}\r\nMessage: ${response.statusText}`);
                        return;
                    }
                    response.json().then((responseData) => {
                        // Get the session time interval from response
                        var timerIntervalMinutes = responseData[0];
                        if (!timerIntervalMinutes) return;
                        var countDownDate = (new Date().getTime()) + timerIntervalMinutes * 60 * 1000;
                        window.localStorage.setItem("expireDate", countDownDate);
                        startSessionCounter();

                        // Get the user data from response
                        setUserData(responseData[1]);
                    }); 
                }); 
        }
    catch (error) { window.alert(error); } 
}

/**
 * Function to store user's data in local storage.
 * @param {user} user - The user object returned from server.
 */
function setUserData(user) {
    if (!user) return;
    window.localStorage.setItem("language", user.language);
    window.localStorage.setItem("theme", user.theme);
    window.localStorage.setItem("customThemeRGBShift", JSON.stringify(user.customTheme.slice(0, 3)));
    window.localStorage.setItem("customThemeImageInvert", user.customTheme[3]);
    window.location.reload();
}

/**
 * Function to apply the dark theme. Sets localStorage item "theme" to "dark".
 * Won't run if "theme" already "dark" in "localStorage".
 */
function darkTheme() {
    lightTheme();   // Restore defaults first

    // Store theme selection in storage
    window.localStorage.setItem("theme", "dark");

    var rgbShift = [255, 255, 255];
    applyTheme(rgbShift, 100);
}

/**
 * Function to apply a custom theme.
 * @param {rgbShift} rgbShift - Array representing the values that will be added or substacted from the original color [rShift, gShift, bShift].
 * @param {imageInvert} imageInvert - [0 to 100] value for --imageInvert which controls the invert filter percent value applied on images.
 * @param {colorNames} colorNames - The color keys stored in ":root" to be changed.
 */
function applyTheme(rgbShift, imageInvert, colorNames = ["--accentColor", "--defaultColor", "--backgroundColor", "--menuColor", "--footerColor", "--highlightColor", "--chatColor", "--sentColor", "--sentBackground", "--recievedColor", "--recievedBackground"]) {
    var root = document.querySelector(":root");

    colorNames.forEach((colorName) => {
        // eslint-disable-next-line no-useless-escape
        var themeColor = shiftRGB(window.getComputedStyle(root).getPropertyValue(colorName).match(/[\d*\.?\d+]+/g), rgbShift);
        if (!themeColor) return;        // Next iteration
        root.style.setProperty(colorName, themeColor);
    });

    if (imageInvert >= 0 && imageInvert <= 100) {
        root.style.setProperty("--imageInvert", `${imageInvert}%`);
    }
}

/**
 * Function to restore the default theme. Sets localStorage item "theme" to "light".
 */
function lightTheme() { 
    // Back to default setting
    var root = document.querySelector(":root");
    root.style.setProperty("--accentColor", "rgb(16, 128, 255)");
    root.style.setProperty("--defaultColor","rgb(0, 0, 0)");
    root.style.setProperty("--backgroundColor", "rgb(255, 255, 255)");
    root.style.setProperty("--menuColor", "rgb(248, 248, 255)");
    root.style.setProperty("--footerColor", "rgb(245, 245, 245)"); 
    root.style.setProperty("--highlightColor", "rgb(211, 211, 211)");
    root.style.setProperty("--quickAccessColor", "rgb(20,20,20)");
    root.style.setProperty("--alertColor", "rgb(216, 32, 32)");
    root.style.setProperty("--imageInvert", "0%");

    // ChatApp defaults
    root.style.setProperty("--chatColor", "rgb(255, 255, 255)");
    root.style.setProperty("--sentColor", "rgb(0, 0, 0)");
    root.style.setProperty("--sentBackground", "rgb(255, 255, 255)");
    root.style.setProperty("--recievedColor", "rgb(0, 0, 0)");
    root.style.setProperty("--recievedBackground", "rgb(200, 200, 200)"); 

    // Store theme selection in storage
    window.localStorage.setItem("theme", "light");
}

/**
 * General purpose function to shift an RGB color by a given vector.
 * @param {rgbColor} rgbColor - Array representing the original color that will be changed [Red, Green, Blue].
 * @param {rgbShift} rgbShift - Array representing the values that will be added or substacted from the original color [rShift, gShift, bShift].
 * @return{rgbColor} rgbColor - The resulting "rgb(r, g, b)" color string. Returns Black if one argument is mising.
 */
function shiftRGB(rgbColor, rgbShift) {

    if(!rgbColor || !rgbShift) return;
    if(rgbColor.length < 3 || rgbShift.length < 3) return;

    var r = parseInt(Math.abs(rgbShift[0] - rgbColor[0]));
    var g = parseInt(Math.abs(rgbShift[1] - rgbColor[1]));
    var b = parseInt(Math.abs(rgbShift[2] - rgbColor[2]));

    return `rgb(${r},${g},${b})`;
}

/**
 * General purpose function to translate the page. Translated elements have to has a case sensitive "locKey" tag.
 * Sets localStorage.language to languageCode.
 * Requires another function: getData(url)
 * @param {languageCode} languageCode - The language to translate to. Won't run if languageCode == localStorage.language
 * @param {translationFile} translationFile - The bath to translation file. Default is: "/javascripts/locals.json".
 */
async function setLanguage(languageCode, translationFile = "/javascripts/locals.json")
{
    // Skip if there's no need to continue.
    if (!languageCode || languageCode === "") return;
    if (document.documentElement.lang  === languageCode) return;

    const locals = await getData(translationFile);
    if (!locals) return;    // Skip if there's no translation file

    // Store language selection in storage
    window.localStorage.setItem("language", languageCode);

    switch(languageCode)
    {
        case "ar":
            document.documentElement.lang = languageCode;
            document.documentElement.dir = "rtl";
            break;

        case "en":
            // Simple -also lazy and reckless- solution. Reload page to restore defaults!
            location.reload(true);
            return;
    }
    
    document.querySelectorAll("[locKey]").forEach((field) => {
        var key = field.getAttribute("locKey");
        var translation = locals[languageCode][key];
        if (!translation) return;   // If no translation available, skip to next iteration
        
        // Apply translation
        field.innerHTML = translation;
    });

    document.querySelectorAll("[locKeyTitle]").forEach((field) => {
        var key = field.getAttribute("locKeyTitle");
        var translation = locals[languageCode][key];
        if (!translation) return;   // If no translation available, skip to next iteration
        
        // Apply translation
        field.title = translation;
    });
}

/**
 * General purpose function to 'fetch' data from a url.
 * @param {url} url - The link to the needed data.
 */
async function getData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) { throw new Error(`Couldn't fetch resources at: ${url}. Response status: ${response.status}`); }
      var json = await response.json();
      return json;
    }
    catch (error) { window.alert(error.message); }
}