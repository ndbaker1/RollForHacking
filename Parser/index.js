

// function getSourceAsDOM(url) {
//     let xmlhttp = new XMLHttpRequest();
//     xmlhttp.addEventListener("load", function() {
//         let parser = new DOMParser();
//         let URLDOM = parser.parseFromString(this.responseText,"text/html")
//         console.log(URLDOM)
//         let globe = URLDOM.getElementsByClassName('ss-globe')
//         console.log(globe)
//         console.log(globe.getBoundingClientRect())
//     });
//     xmlhttp.open("GET", 'https://cors-anywhere.herokuapp.com/'+url);
//     xmlhttp.send();   
// }
function getSourceAsDOM(url){
    let newTab = window.open(url,"_blank")
    newTab.window.onload = function() {
        test(this.document)
        test(this.document.getElementsByClassName('ss-globe'))
    }
}

window.onload = function() {
    document.getElementById('car-btn').addEventListener('click', () => {
        getSourceAsDOM("https://post.devpost.com/") 
    })
}