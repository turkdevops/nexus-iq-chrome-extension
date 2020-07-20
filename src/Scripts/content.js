/*jslint es6  -W024 */
"use strict";

console.log("content.js?v1.9.3.40");
// import { formats } as utils from "./utils.js";
// const { formats } = require("../src/Scripts/utils");

var browser;
var message;
if (typeof chrome !== "undefined") {
  browser = chrome;
  browser.runtime.onMessage.addListener(gotMessage);
}

function gotMessage(receivedMessage, sender, sendResponse) {
  try {
    console.log("gotMessage", receivedMessage);
    message = receivedMessage;

    console.log(
      "messageTypes.vulnerability",
      message.messagetype,
      message.messagetype === messageTypes.vulnerability
    );

    switch (message.messagetype) {
      case messageTypes.beginEvaluate:
        console.debug("begin evaluate message");
        processPage(message);
        break;
      case messageTypes.vulnerability:
        console.log("vulnerability message", message);
        processVulnerability(message);
        break;
      case messageTypes.rightClick:
        console.log("vulnerability message", message);
        processRightClick(message);
        break;

      default:
        console.log("Unknown message type: " + message.messagetype);
        break;
    }
  } catch (err) {
    let errmessage = {
      artifact: null,
      message: err.message,
      messagetype: messageTypes.error,
    };
    browser.runtime.sendMessage(errmessage);
  }
}

function processVulnerability(message) {
  console.log("processVulnerability", message);
  let artifact = message.artifact;
  let vulnClass = message.message.vulnClass;
  console.debug("Setting vuln class: " + vulnClass);
  // console.debug("browser: ", browser);
  var repoDetails = findRepoType();
  console.debug("repoDetails: ", repoDetails);
  if (repoDetails) {
    var x = document.querySelectorAll(repoDetails.titleSelector);
    console.debug("found titles", x);
    let maxnum = 1; //x.length;
    for (var i = 0; i < maxnum; i++) {
      console.debug("adding to class: " + vulnClass);
      x[i].classList.add(vulnClass);
      x[i].classList.add("vuln");
    }
  }
}

function processPage(message = { messagetype: messageTypes.beginEvaluate }) {
  console.log("processPage - message:", message);
  $(window).bind("load", function () {
    // code goes here
    console.log("Page loaded", $("div > h2"));
  });
  // var faScript = $(document.createElement('script')).attr('src', 'https://kit.fontawesome.com/a076d05399.js');
  // $(body).append(faScript);

  //please tell what is my url and what is my content
  var url = window.location.href;
  console.log("url", url);
  if (message.messagetype !== messageTypes.evaluateComponent) {
    let artifact = ParsePage();
    console.log("artifact", artifact);
    if (artifact != undefined) {
      let format = artifact.format;
    }
    let evaluatemessage = {
      artifact: artifact,
      messagetype: messageTypes.evaluateComponent,
      url: url,
    };
    console.log(
      "browser.runtime.sendMessage(evaluatemessage)",
      evaluatemessage
    );

    browser.runtime.sendMessage(evaluatemessage);
  } else if (message.messagetype !== messageTypes.annotateComponent) {
    console.log("message.messagetype", message.messagetype);
  } else {
    console.log("message.messagetype", message.messagetype);
  }
}

function processRightClick(message) {
  console.log("processRightClick", message);
  let artifact = message.artifact;
  let vulns = message.OSSIndexDataResp.message.response.vulnerabilities;
  let maxVuln = vulns.reduce((acc, curr) => {
    return acc > curr.cvssScore ? acc : curr.cvssScore;
  }, 0);
  let vulnClass = maxVuln >= 8 ? "severe-vuln" : maxVuln > 5 ? "medium" : "";
  console.debug("Setting vuln class: " + vulnClass);
  // console.debug("browser: ", browser);
  // var repoDetails = findRepoType();
  // console.debug("repoDetails: ", repoDetails);
  var packagename = message.targetElement.selectionText;
  var repoDetails = "rpm";
  if (vulns.length > 0) {
    var x = document.querySelectorAll(`a[href='${packagename}']`);
    console.debug("found titles", x);
    let maxnum = 1; //x.length;
    for (var i = 0; i < maxnum; i++) {
      console.debug("adding to class15: " + vulnClass);
      x[i].classList.add(vulnClass);
      x[i].classList.add("vuln");

      var newContent = vulns
        .map((vuln) => {
          return vuln.cve;
        })
        .join(", ");
      createModal(newContent);
      // element.appendChild(newContent);
      // console.log("newContent, element", newContent, element);
      // var currentDiv = document.getElementById("div1");
      // document.body.insertBefore(element, x[i]);
      // console.log("element.parentNode", element.parentNode, x[i], newContent);
    }
  }
}

let createModal2 = (modalContent) => {
  console.log("createModal", modalContent);
  // Definitions
  let modal = document.createElement("div"),
    modalStyle = document.createElement("style"),
    modalCSS =
      ".js-modal{ position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(0, 0, 0, .1); max-width: 650px; border-radius: 5px; } .js-modal img, .js-modal iframe, .js-modal video{ max-width: 100%; } .js-modal-inner{ position: relative; padding: 10px; } .js-modal-close{ position: absolute; top: -10px; right: -10px; background-color: black; color: #eee; border-width: 0; font-size: 10px; height: 24px; width: 24px; border-radius: 100%; text-align: center; }",
    modalClose =
      '<button class="js-modal-close" id="js_modal_close">X</button>',
    theBody = document.getElementsByTagName("body")[0],
    theHead = document.getElementsByTagName("head")[0];

  // Add content and attributes to the modal
  modal.setAttribute("class", "js-modal");
  modal.innerHTML =
    '<div class="js-modal-inner">' + modalContent + modalClose + "</div>";
  theBody.appendChild(modal);

  modalClose = document.querySelector("#js_modal_close");

  // Add the modal styles dynamically
  if (modalStyle.styleSheet) {
    modalStyle.styleSheet.cssText = modalCSS;
  } else {
    modalStyle.appendChild(document.createTextNode(modalCSS));
  }
  theHead.appendChild(modalStyle);
  console.log("modal", modal);
  // Close the modal on button-click
  if (modalClose) {
    modalClose.addEventListener("click", function () {
      modal.remove();
      modalStyle.remove();
    });
  }
};

let createModal = (modalContent) => {
  // < !--The Modal-- >
  let wrapper = document.createElement("div");
  wrapper.id = "wrapper";
  wrapper.className = "cve-modal";
  // wrapper.style.display = "block";
  // <!-- Modal content -->
  let myModalContent = document.createElement("div");
  myModalContent.className = "cve-modal-content";

  let mySpan = document.createElement("span");
  mySpan.id= "cve_modal_close_id"
  mySpan.className = "cve-modal-close";
  mySpan.textContent = "X";
  mySpan.onclick = function () {
    wrapper.style.display = "none";
  };
  let pText = document.createElement("p");
  pText.textContent = modalContent;
  pText.className = "cve-body";
  myModalContent.appendChild(mySpan);
  myModalContent.appendChild(pText);
  wrapper.appendChild(myModalContent);
  document.body.appendChild(wrapper);
  var modal = document.getElementById("wrapper");
  //show the popup
   wrapper.style.display = "block";
  // // Get the button that opens the modal
  // var btn = document.getElementById("myBtn");

  // Get the <span> element that closes the modal
  // var span = document.getElementsByClassName("cve-modal-close")[0];
  var span = document.getElementById("cve_modal_close_id");
  
  // When the user clicks on <span> (x), close the modal
  // span.onclick = function () {
  //   wrapper.style.display = "none";
  // };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == wrapper) {
      wrapper.style.display = "none";
    }
  };
};
