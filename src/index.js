import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import { renderMentionsButton } from "./components/userMentionsSelect";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";

const extension_name = "Mentions UI";

const panelConfig = {
  tabTitle: extension_name,
  settings: [
    {
      id: "watch-page",
      name: "Page To Watch",
      description: "This is the tag the mentions UI will show next to",
      action: {
        type: "input",
        placeholder: "Enter name to watch",
        onChange: (evt) => {
          console.log("Input Changed!", evt);
          updateAttributeObserver(); // Update observer when settings change
        }
      }
    }
  ]
};
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
  const results = [];
  const firstChildWithDataLinkTitle = spanElement.querySelector('[data-link-title]');
  
  if (firstChildWithDataLinkTitle && names.some(name => firstChildWithDataLinkTitle.getAttribute('data-link-title').includes(name))) {
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
async function spanObserverCallback(spanElement, extensionAPI) {
  const namesToObserve = await extensionAPI.settings.get("watch-page") || ['Default Name']; // Fetch dynamically
  const results = processBlock(spanElement, namesToObserve.split(',').map(name => name.trim()));
  if (results.length > 0) {
    console.log(results);
  }
}

const updateAttributeObserver = async (extensionAPI) => {
  if (attributeObserver) {
    attributeObserver.disconnect();
  }
  attributeObserver = createHTMLObserver({
    className: "roam-block",
    tag: "DIV",
    useBody: true,
    callback: (element) => spanObserverCallback(element, extensionAPI),
  });
};

async function onload({ extensionAPI }) {
  extensionAPI.settings.panel.create(panelConfig);
  console.log(extensionAPI.settings.get("watch-page"));
  
  updateAttributeObserver(extensionAPI);
}

function onunload() {
  if (attributeObserver) {
    attributeObserver.disconnect();
  }
    // remove the buttons
    // Get all elements with the class "mentions-select-button"
    const elementsToRemove = document.querySelectorAll(".mentions-select-button");
    elementsToRemove.forEach(element => {
      element.parentNode.removeChild(element);
    });

        
  console.log(`unload ${extension_name} plugin`);
}

export default {
  onload,
  onunload
};