import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import { renderMentionsButton, cleanup } from "./components/userMentionsSelect";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import { NotificationStatesSetting } from "./components/SettingsComponents";

const extension_name = "Mentions UI";

let attributeObserver;

// Function to process a single block
function processBlock(spanElement, name, states) {
  const firstChildWithDataLinkTitle = spanElement.querySelector('[data-link-title]');
  
  if (firstChildWithDataLinkTitle && firstChildWithDataLinkTitle.getAttribute('data-link-title').includes(name)) {
    const dataLinkTitleValue = firstChildWithDataLinkTitle.getAttribute('data-link-title');
    const blockUid = getBlockUidFromTarget(spanElement);
    renderMentionsButton(firstChildWithDataLinkTitle, dataLinkTitleValue, blockUid, states);
  }
}

const DEFAULT_STATES = [
  { name: "🚨 Notify", prefix: "@" },
  { name: "✅ Mark Read", prefix: "~" },
  { name: "📨 CC:", prefix: "cc:" },
  { name: "💾 Bookmark", prefix: "^" }
];

// Callback function to be used with createHTMLObserver
async function spanObserverCallback(spanElement, extensionAPI) {
  const nameToObserve = await extensionAPI.settings.get("watch-page") || '';
  const states = await extensionAPI.settings.get("notification-states") || DEFAULT_STATES;
  processBlock(spanElement, nameToObserve, states);
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
  const wrappedNotificationStatesSetting = () => NotificationStatesSetting({ extensionAPI });

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
            updateAttributeObserver(extensionAPI);
          }
        }
      },
      {
        id: "notification-states",
        name: "Notification States",
        description: "Manage notification states",
        action: { type: "reactComponent", component: wrappedNotificationStatesSetting }
      }
    ]
  };

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
  
  // Cleanup the MutationObserver
  cleanup();
  
  console.log(`unload ${extension_name} plugin`);
}

export default {
  onload,
  onunload
};