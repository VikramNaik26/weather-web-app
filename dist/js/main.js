import CurrentLocation from "./CurrentLocation.js";
import {
  setPlaceholderText,
  addSpinner,
  displayError,
  updateScreenReaderConfirmation,
  displayApiError,
  updateDisplay,
} from "./domFunction.js";
import {
  setLocationObject,
  getHomeLocation,
  getweatherFromCoords,
  getCoorsFromApi,
  cleanText,
} from "./dataFunctions.js";
const currentLoc = new CurrentLocation();

const initApp = () => {
  // add listeners
  const geoButton = document.getElementById("getLocation");
  geoButton.addEventListener("click", getGeoWeather);
  const homeButton = document.getElementById("home");
  homeButton.addEventListener("click", loadWeather);
  const saveButton = document.getElementById("saveLocation");
  saveButton.addEventListener("click", saveLocation);
  const unitButton = document.getElementById("unit");
  unitButton.addEventListener("click", setUnitPref);
  const refreshButton = document.getElementById("refresh");
  refreshButton.addEventListener("click", refreshWeather);
  const locationEntry = document.getElementById("searchBar__form");
  locationEntry.addEventListener("submit", submitNewLocation);
  // setup
  setPlaceholderText();
  // load weather
  loadWeather();
};

document.addEventListener("DOMContentLoaded", initApp);

const getGeoWeather = (event) => {
  if (event) {
    if (event.type === "click") {
      // add a spiner to a button
      const mapIcon = document.querySelector(".fa-map-marker-alt");
      addSpinner(mapIcon);
    }
  }
  if (!navigator.geolocation) geoError();
  navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
  // navigator is inbuilt object that has access to brower details and we can access location from it
};

const geoError = (errObj) => {
  const errMsg = errObj.message ? errObj.message : "Geolocation not supported";
  displayError(errMsg, errMsg);
};

const geoSuccess = (position) => {
  const myCoordObj = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    name: `Lat:${position.coords.latitude} Long:${position.coords.longitude}`,
  };

  // set location object
  setLocationObject(currentLoc, myCoordObj);
  // console.log(currentLoc);
  // update data and display
  updateDataAndDisplay(currentLoc);
};

const loadWeather = (event) => {
  const savedLocation = getHomeLocation();
  if (!savedLocation && !event) return getGeoWeather();
  if (!savedLocation && event.type === "click") {
    displayError(
      "No Home Location Saved",
      "Sorry Please save your Home Location first"
    );
  } else if (savedLocation && !event) {
    displayHomeLocationWeather(savedLocation);
  } else {
    const homeIcon = document.querySelector(".fa-home");
    addSpinner(homeIcon);
    displayHomeLocationWeather(savedLocation);
  }
};

const displayHomeLocationWeather = (home) => {
  if (typeof home === "string") {
    const locationJson = JSON.parse(home);
    const myCoordObj = {
      lat: locationJson.lat,
      lon: locationJson.lon,
      name: locationJson.name,
      unit: locationJson.unit,
    };

    setLocationObject(currentLoc, myCoordObj);
    updateDataAndDisplay(currentLoc);
  }
};

const saveLocation = () => {
  if (currentLoc.getLat() && currentLoc.getLon()) {
    const saveIcon = document.querySelector(".fa-save");
    addSpinner(saveIcon);
    const location = {
      name: currentLoc.getName(),
      lat: currentLoc.getLat(),
      lon: currentLoc.getLon(),
      unit: currentLoc.getUnit(),
    };
    localStorage.setItem("defaultWeatherLocation", JSON.stringify(location));
    updateScreenReaderConfirmation(
      `Saved ${currentLoc.getName()} as home location`
    );
  }
};

const setUnitPref = () => {
  const unitIcon = document.querySelector(".fa-chart-bar");
  addSpinner(unitIcon);
  currentLoc.toggleUnit();
  updateDataAndDisplay(currentLoc);
};

const refreshWeather = () => {
  const refreshIcon = document.querySelector(".fa-sync-alt");
  addSpinner(refreshIcon);
  updateDataAndDisplay(currentLoc);
};

const submitNewLocation = async (event) => {
  event.preventDefault();
  const text = document.getElementById("searchBar__text").value;
  const entryText = cleanText(text);
  if (!entryText.length) return;
  const locationIcon = document.querySelector(".fa-search");
  addSpinner(locationIcon);
  const coordsData = await getCoorsFromApi(entryText, currentLoc.getUnit());
  if (coordsData) {
    // work with Api data
    if (coordsData.cod === 200) {
      // success
      const myCoordObj = {
        lat: coordsData.coord.lat,
        lon: coordsData.coord.lon,
        name: coordsData.sys.country
          ? `${coordsData.name}, ${coordsData.sys.country}`
          : coordsData.name,
      };
      setLocationObject(currentLoc, myCoordObj);
      updateDataAndDisplay(currentLoc);
    } else {
      displayApiError(coordsData);
    }
  } else {
    displayError("Connection Error", "Connection Error");
  }
};
const updateDataAndDisplay = async (locationObj) => {
  // console.log(locationObj);
  // https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=84ad5a6a892e46446f0720e9520105bb
  // https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude={part}&appid=84ad5a6a892e46446f0720e9520105bb
  const weatherJson = await getweatherFromCoords(locationObj);
  console.log(weatherJson);
  if (weatherJson) updateDisplay(weatherJson, locationObj);
};
