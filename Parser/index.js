
function loadPreviewSite(url, sitePreviewElement) {
    // making request to get DOM of external url
    const xmlhttp = new XMLHttpRequest()
    // listener/callback for an xmlhttp response
    xmlhttp.onreadystatechange = function() {
        // respond to successfull requests
        if (this.readyState == 4 && this.status == 200) {
            // parse the incoming page into a DOM object
            const parser = new DOMParser();
            const externalDocument = parser.parseFromString(this.responseText,"text/html")
            
            // empty the container and put attach the new site data
            sitePreviewElement.innerHTML = ''
            sitePreviewElement.appendChild(externalDocument.head)
            sitePreviewElement.appendChild(externalDocument.body)
        }
    }
    xmlhttp.open("GET", 'https://cors-anywhere.herokuapp.com/'+url);
    xmlhttp.send();   
}

// parses the current preview site container into an array of playforms
function parseCurrentSite(sitePreviewElement) {
    const levelPlatforms = []
    // recursive DOM crawling parse algorithm
    function parseDOM(elem) {
        const rect = elem.getBoundingClientRect()
        // if the element is too big, look inside it 
        if ( rect.width > 500 && rect.height > 500 ) {
            for (child of elem.children) {
                parseDOM(child)
            }
        // if the element is too small do not consider it 
        } else if ( rect.width > 20 && rect.height > 20 ){
            levelPlatforms.push(rect)
        }
    }
    // start parsong on the body of the preview container
    parseDOM(sitePreviewElement.childNodes[1])
    return levelPlatforms
}


window.onload = function() {
    document.getElementById('car-btn').addEventListener('click', () => {
        loadPreviewSite("https://post.devpost.com/", document.getElementById('external-preview'))
    })
    document.getElementById('get-btn').addEventListener('click', () => {
        console.log (
            parseCurrentSite(document.getElementById('external-preview'))
        )
    })
}
