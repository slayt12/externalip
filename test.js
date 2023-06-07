let header = '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"';

let edgePattern = /("Microsoft Edge");v="(\d+)"/;
let match = header.match(edgePattern);
console.log(match);
if (match) {
  let edgeName = match[1];
  let edgeVersion = match[2];
  console.log('Browser: ' + edgeName);
  console.log('Version: ' + edgeVersion);
}
