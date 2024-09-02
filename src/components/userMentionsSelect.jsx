import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import updateBlock from "roamjs-components/writes/updateBlock";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";

function swapNotificationState(str, newState, states) {
    const stateMap = Object.fromEntries(states.map(state => [state.name, state.prefix]));

    const parts = str.split('[[');
    if (parts.length > 1) {
      const name = parts[1].split(']]')[0];
      return newState !== "None" 
        ? `${stateMap[newState]}${name}]]`
        : name;
    }
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
          const new_block_string = currentValue.replace(`[[${attributeName}]]`, `[[${new_state_string}]]`);
          
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
    const containerSpan = document.createElement("span");
    containerSpan.onmousedown = (e) => e.stopPropagation();
    ReactDOM.render(
      <AttributeButton attributeName={mentionsName} uid={blockUid} states={states} />,
      containerSpan
    );
    
    parent.insertBefore(containerSpan, parent.firstChild);
  };