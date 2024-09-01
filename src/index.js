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
          updateAttributeObserver(extensionAPI);
        }
      }
    }
  ]
};
let attributeObserver;

// Function to process a single block
function processBlock(spanElement, name) {
  const firstChildWithDataLinkTitle = spanElement.querySelector('[data-link-title]');
  
  if (firstChildWithDataLinkTitle && firstChildWithDataLinkTitle.getAttribute('data-link-title').includes(name)) {
    const dataLinkTitleValue = firstChildWithDataLinkTitle.getAttribute('data-link-title');
    const blockUid = getBlockUidFromTarget(spanElement);
    renderMentionsButton(firstChildWithDataLinkTitle, dataLinkTitleValue, blockUid);
  }
}

// Callback function to be used with createHTMLObserver
async function spanObserverCallback(spanElement, extensionAPI) {
  const nameToObserve = await extensionAPI.settings.get("watch-page") || 'Default Name';
  processBlock(spanElement, nameToObserve);
}

const updateAttributeObserver = (extensionAPI) => {
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
  updateAttributeObserver(extensionAPI);
}

function onunload() {
  if (attributeObserver) {
    attributeObserver.disconnect();
  }
  // remove the buttons
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