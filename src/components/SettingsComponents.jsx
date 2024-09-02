import React, { useState, useEffect } from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";

const DEFAULT_STATES = [
  { name: "🚨 Notify", prefix: "@" },
  { name: "✅ Mark Read", prefix: "~" },
  { name: "📨 CC:", prefix: "cc:" },
  { name: "💾 Bookmark", prefix: "^" }
];

export const NotificationStatesSetting = ({ extensionAPI }) => {
  const [states, setStates] = useState([]);
  const [newState, setNewState] = useState({ name: "", prefix: "" });

  useEffect(() => {
    const loadStates = async () => {
      const savedStates = await extensionAPI.settings.get("notification-states");
      if (savedStates === null || savedStates === undefined) {
        // If no states are saved, set and save the default states
        setStates(DEFAULT_STATES);
        await extensionAPI.settings.set("notification-states", DEFAULT_STATES);
      } else {
        setStates(savedStates);
      }
    };
    loadStates();
  }, [extensionAPI]);

  const addState = async () => {
    if (newState.name && newState.prefix) {
      const updatedStates = [...states, newState];
      setStates(updatedStates);
      await extensionAPI.settings.set("notification-states", updatedStates);
      setNewState({ name: "", prefix: "" });
    }
  };

  const deleteState = async (index) => {
    const updatedStates = states.filter((_, i) => i !== index);
    setStates(updatedStates);
    await extensionAPI.settings.set("notification-states", updatedStates);
  };

  const moveState = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= states.length) return;
    
    const updatedStates = [...states];
    [updatedStates[index], updatedStates[newIndex]] = [updatedStates[newIndex], updatedStates[index]];
    setStates(updatedStates);
    await extensionAPI.settings.set("notification-states", updatedStates);
  };

  return (
    <div>
      <h3>Notification States</h3>
      {states.map((state, index) => (
        <div key={index} style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: "10px" }}>{state.name} ({state.prefix})</span>
          <Button icon="arrow-up" minimal onClick={() => moveState(index, -1)} disabled={index === 0} />
          <Button icon="arrow-down" minimal onClick={() => moveState(index, 1)} disabled={index === states.length - 1} />
          <Button icon="trash" minimal onClick={() => deleteState(index)} />
        </div>
      ))}
      <FormGroup label="Add New State">
        <InputGroup
          placeholder="Name (with emoji)"
          value={newState.name}
          onChange={(e) => setNewState({ ...newState, name: e.target.value })}
          style={{ marginBottom: "5px" }}
        />
        <InputGroup
          placeholder="Prefix"
          value={newState.prefix}
          onChange={(e) => setNewState({ ...newState, prefix: e.target.value })}
          style={{ marginBottom: "5px" }}
        />
        <Button onClick={addState} text="Add State" />
      </FormGroup>
    </div>
  );
};