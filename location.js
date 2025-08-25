const options = {
    maximumAge:30000,
    enableHighAccuracy: false,
    timeout: 60000,
}

const success = (pos) => {
    const coords = pos.coords;
    console.log(coords);
}

const error = (err) => {
console.log(err);
}

navigator.geolocation.getCurrentPosition(success, error, options);