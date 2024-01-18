import React, { useEffect, useMemo, useRef, useState, ReactText } from "react";
import ReactDOM from "react-dom";
import { Classes, Button, Tabs, Tab, Card, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import createBlock from "roamjs-components/writes/createBlock";
import { InputTextNode, PullBlock } from "roamjs-components/types";
import getSubTree from "roamjs-components/util/getSubTree";
import updateBlock from "roamjs-components/writes/updateBlock";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import createPage from "roamjs-components/writes/createPage";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import addStyle from "roamjs-components/dom/addStyle";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { render as renderToast } from "roamjs-components/components/Toast";

function swapNotificationState(str, newState) {
    const states = {
      "🚨 Notify": '@[[', // Notify state
      "✅ Mark Read": '~[[', // Seen state
      "📨 CC:": 'cc:[[' , // CC state
      "💾 Bookmark": '^[[', // Bookmark state
      "None": '' // No notification state
    };

    // Build a regular expression to match any of the states or a standalone name
    const regex = /(@|\~|cc:|\^)?\[\[(.*?)\]\]/g;

    // Check if the string contains a notification state
    if (regex.test(str)) {
      // Replace the current state with the desired state
      return str.replace(regex, (match, prefix, name) => {
        return states[newState] + name + (states[newState] ? ']]' : '');
      });
    } else {
      // If there's no match, and the new state is not "None", add the new state syntax
      return newState !== "None" ? states[newState] + str + ']]' : str;
    }
  }

const AttributeButtonPopover = ({
    items,
    setIsOpen,
    attributeName,
    uid,
    currentValue,
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
            const new_state_string = swapNotificationState(attributeName, s)
            const new_block_string = currentValue.replace(`[[${attributeName}]]`, `[[${new_state_string}]]`)
            
          updateBlock({
            text: new_block_string,
            uid,
          });
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
          onClick={() => setIsOpen(true)}
        />
      </AttributeSelect>
    );
  };
  
const AttributeButton = ({
    attributeName,
    uid,
    }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const [options, setOptions] = useState(["🚨 Notify", "✅ Mark Read", "📨 CC:", "💾 Bookmark", "None"]);
    const [currentValue, setCurrentValue] = useState("");
    
    useEffect(() => {
        if (isOpen) {
        
        // setOptions(optionsNode.children.map((t) => t.text));
        // const regex = new RegExp(`^${attributeName}::\\s*`);
        
        setCurrentValue(getTextByBlockUid(uid))
        // setCurrentValue(getTextByBlockUid(uid).replace(`[[${attributeName}]]`, "").trim());
        }
    }, [isOpen]);

    return (
        <AttributeButtonPopover
        setIsOpen={setIsOpen}
        items={options}
        attributeName={attributeName}
        uid={uid}
        currentValue={currentValue}
        />
    );
};

export const renderMentionsButton = (
    parent,
    mentionsName,
    blockUid
  ) => {
    const containerSpan = document.createElement("span");
    containerSpan.onmousedown = (e) => e.stopPropagation();
    ReactDOM.render(
      <AttributeButton attributeName={mentionsName} uid={blockUid} />,
      containerSpan
    );
    // parent.appendChild(containerSpan);
    parent.insertBefore(containerSpan, parent.firstChild);

  };