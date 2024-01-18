import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import { renderMentionsButton } from "./components/userMentsionsSelect";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";

const extension_name = "Mentions UI"
const panelConfig = {
  tabTitle: extension_name,
  settings: [
      {id:          "button-setting",
       name:        "Button test",
       description: "tests the button",
       action:      {type:    "button",
                     onClick: (evt) => { console.log("Button clicked!"); },
                     content: "Button"}},
      {id:          "switch-setting",
       name:        "Switch Test",
       description: "Test switch component",
       action:      {type:     "switch",
                     onChange: (evt) => { console.log("Switch!", evt); }}},
      {id:     "input-setting",
       name:   "Input test",
       action: {type:        "input",
                placeholder: "placeholder",
                onChange:    (evt) => { console.log("Input Changed!", evt); }}},
      {id:     "select-setting",
       name:   "Select test",
       action: {type:     "select",
                items:    ["one", "two", "three"],
                onChange: (evt) => { console.log("Select Changed!", evt); }}}
  ]
};
const unloads = new Set();
let attributeObserver;

function getAllUsernames() {  
  let query = `[:find ?name 
                :where 
                  [?user :user/uid _] 
                  [?user :user/display-name ?name]
                ]`;

  let results = window.roamAlphaAPI.q(query).flat();
	
  return results;
}

function findUserPageSpans(names) {
  // Iterate through each name
  results = []
  names.forEach(name => {
    // Select all roam-block elements that have a descendant with the specific data-link-title
    const blocksWithMatchingName = document.querySelectorAll(`.roam-block:has([data-link-title="${name}"])`);
    
    blocksWithMatchingName.forEach(block => {
      // Get the direct child span of each block
      const directChildSpan = block.querySelector('span:first-child');
      if (directChildSpan) {
        // Find the first child element with a data-link-title attribute
        const firstChildWithDataLinkTitle = directChildSpan.querySelector('[data-link-title]');
        if (firstChildWithDataLinkTitle) {
          // Get the value of the data-link-title attribute
          const dataLinkTitleValue = firstChildWithDataLinkTitle.getAttribute('data-link-title');
          const blockUid = getBlockUidFromTarget(directChildSpan);
          // Log the direct child span and the data-link-title value
          // console.log(directChildSpan, dataLinkTitleValue);
          results.push({
            "span":firstChildWithDataLinkTitle,
            "page":dataLinkTitleValue,
            "blockUid":blockUid,
          })
          // Do something with the direct child span and the data-link-title value
          // For example, you can add a class to it
          // directChildSpan.classList.add('highlight');
        }
      }
    });
  });
  return results;
}

// Function to process a single block
function processBlock(spanElement, names) {
  // Your existing logic to process a single span element
  const results = [];
  const firstChildWithDataLinkTitle = spanElement.querySelector('[data-link-title]');
  
  if (firstChildWithDataLinkTitle && names.some(name => firstChildWithDataLinkTitle.getAttribute('data-link-title').includes(name))) {
    // console.log(firstChildWithDataLinkTitle.getAttribute('data-link-title'));
    
    const dataLinkTitleValue = firstChildWithDataLinkTitle.getAttribute('data-link-title');
    const blockUid = getBlockUidFromTarget(spanElement);
    results.push({
      "span": firstChildWithDataLinkTitle,
      "page": dataLinkTitleValue,
      "blockUid": blockUid,
    });
    renderMentionsButton(firstChildWithDataLinkTitle, dataLinkTitleValue, blockUid);
  }
  return results;
}

// Callback function to be used with createHTMLObserver
function spanObserverCallback(spanElement) {
  const namesToObserve = ['Matt Vogel', 'test']; // Replace with the actual names you're interested in
  const results = processBlock(spanElement, namesToObserve);
  if (results.length>0) {
    console.log(results);
  }
  
}

const updateAttributeObserver = () => {
  if (attributeObserver) {
    attributeObserver.disconnect();
  }
  attributeObserver = createHTMLObserver({
    className: "roam-block",
    tag: "DIV",
    useBody: true,
    callback: spanObserverCallback,
  });
};

async function onload({extensionAPI}) {
  // set defaults if they dont' exist

  extensionAPI.settings.panel.create(panelConfig);
  // observeSpanElements()
  // const spans = findUserPageSpans(getAllUsernames())
  // spans.forEach(s => {        
  //   renderMentionsButton(s.span, s.page, s.blockUid);
  // });
  updateAttributeObserver()
  unloads.add(() => {
    attributeObserver.disconnect();;
  });
  console.log(`load ${extension_name} plugin`);
}

function onunload() {
  // unload the mutation observers
  console.log(unloads);
  
  unloads.forEach((u) => u());
  unloads.clear();
  // remove the buttons
  // Get all elements with the class "mentions-select-button"
  var elementsToRemove = document.getElementsByClassName("mentions-select-button");

  // Iterate through the elements and remove them
  for (var i = elementsToRemove.length - 1; i >= 0; i--) {
      elementsToRemove[i].parentNode.removeChild(elementsToRemove[i]);
  }

  console.log(`unload ${extension_name} plugin`);
}

export default {
onload,
onunload
};
