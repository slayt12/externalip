const string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.37"

string.split(",").forEach((item, index) => {
    console.log(item.match(/Edg\/\d{1,3}\.\d{1,3}\.\d{1,4}\.\d{1,3}/g));
});