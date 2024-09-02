import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import updateBlock from "roamjs-components/writes/updateBlock";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";

function swapNotificationState(str, newState, states) {
    const stateMap = Object.fromEntries(states.map(state => [state.name, state.prefix]));
    const newPrefix = stateMap[newState];

    // Regular expression to match any prefix and the content within the brackets
    const regex = /^(@|~|cc:|\^)?(\[\[.+?\]\])$/;

    const match = str.match(regex);
    if (match) {
        const [, , content] = match;
        if (newPrefix === "") {
            // If the new prefix is empty, just return the content without any prefix
            return content;
        } else {
            // Otherwise, add the new prefix
            return `${newPrefix}${content}`;
        }
    }
    
    // If the input doesn't match the expected format, return it unchanged
    return str;
}

const AttributeButtonPopover = ({
    items,
    attributeName,
    uid,
    currentValue,
    states,
    filterable = false,
  }) => {
    const AttributeSelect = Select.ofType();
    const itemPredicate = (query, item) => {
      return String(item).toLowerCase().includes(query.toLowerCase());
    };
  
    return (
      <AttributeSelect
        className="inline-menu-item-select"
        itemRenderer={(item, { modifiers, handleClick }) => (
          <MenuItem
            key={item}
            text={item}
            active={modifiers.active}
            onClick={handleClick}
          />
        )}
        itemPredicate={itemPredicate}
        items={items}
        onItemSelect={(s) => {
          const new_state_string = swapNotificationState(attributeName, s, states);
          const new_block_string = currentValue.replace(attributeName, new_state_string);
          
          updateBlock({
            text: new_block_string,
            uid,
          })
        }}
        activeItem={currentValue}
        filterable={filterable}
      >
        <Button
          className="mentions-select-button p-0 ml-1"
          icon="chevron-down"
          style={{ minHeight: 15, minWidth: 20 }}
          intent="primary"
          minimal
        />
      </AttributeSelect>
    );
  };
  
const AttributeButton = ({
    attributeName,
    uid,
    states,
    }) => {
    const [currentValue, setCurrentValue] = useState("");
    
    useEffect(() => {
        setCurrentValue(getTextByBlockUid(uid));
    }, [uid]);

    return (
        <AttributeButtonPopover
        items={states.map(state => state.name)}
        attributeName={attributeName}
        uid={uid}
        currentValue={currentValue}
        states={states}
        />
    );
};

export const renderMentionsButton = (
  parent,
  mentionsName,
  blockUid,
  states
) => {
  // Check if there's already a menu for this tag
  const existingMenu = parent.querySelector('.mentions-select-button');
  if (existingMenu) {
    // If a menu already exists, remove it
    existingMenu.parentElement.remove();
  }

  const containerSpan = document.createElement("span");
  containerSpan.onmousedown = (e) => e.stopPropagation();
  containerSpan.className = 'mentions-menu-container'; // Add a class for easier identification

  ReactDOM.render(
    <AttributeButton attributeName={mentionsName} uid={blockUid} states={states} />,
    containerSpan
  );
  
  parent.insertBefore(containerSpan, parent.firstChild);
};

// Function to clean up orphaned menus
const cleanupOrphanedMenus = () => {
const orphanedMenus = document.querySelectorAll('.mentions-menu-container:not(:first-child)');
orphanedMenus.forEach(menu => menu.remove());
};

// Add a mutation observer to clean up orphaned menus
const observer = new MutationObserver(cleanupOrphanedMenus);
observer.observe(document.body, { childList: true, subtree: true });

// Cleanup function to disconnect the observer when the extension is unloaded
export const cleanup = () => {
observer.disconnect();
};