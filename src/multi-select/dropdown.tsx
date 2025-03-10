/**
 * A generic dropdown component.  It takes the children of the component
 * and hosts it in the component.  When the component is selected, it
 * drops-down the contentComponent and applies the contentProps.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useDidUpdateEffect } from "../hooks/use-did-update-effect";
import { useKey } from "../hooks/use-key";
import { useMultiSelect } from "../hooks/use-multi-select";
import { KEY } from "../lib/constants";
import SelectPanel from "../select-panel";
import { Cross } from "../select-panel/cross";
import { Arrow } from "./arrow";
import { DropdownHeader } from "./header";
import { Loading } from "./loading";

const Dropdown = () => {
  const {
    t,
    onMenuToggle,
    ArrowRenderer,
    shouldToggleOnHover,
    isLoading,
    disabled,
    onChange,
    labelledBy,
    value,
    isOpen,
    defaultIsOpen,
    ClearSelectedIcon,
    closeOnChangedValue,
  } = useMultiSelect();

  useEffect(() => {
    if (closeOnChangedValue) {
      setExpanded(false);
    }
  }, [value]);

  const [isInternalExpand, setIsInternalExpand] = useState(true);
  const [expanded, setExpanded] = useState(defaultIsOpen);
  const [hasFocus, setHasFocus] = useState(false);
  const FinalArrow = ArrowRenderer || Arrow;

  const wrapperRef = useRef<HTMLDivElement>(null);

  useDidUpdateEffect(() => {
    onMenuToggle && onMenuToggle(expanded);
  }, [expanded]);

  useEffect(() => {
    if (defaultIsOpen === undefined && typeof isOpen === "boolean") {
      setIsInternalExpand(false);
      setExpanded(isOpen);
    }
  }, [isOpen, defaultIsOpen]);

  const handleKeyDown = (e) => {
    // allows space and enter when focused on input/button
    if (
      ["text", "button"].includes(e.target.type) &&
      [KEY.SPACE, KEY.ENTER].includes(e.code)
    ) {
      return;
    }

    if (isInternalExpand) {
      if (e.code === KEY.ESCAPE) {
        setExpanded(false);
        wrapperRef?.current?.focus();
      } else {
        setExpanded(true);
      }
    }
    e.preventDefault();
  };

  useKey([KEY.ENTER, KEY.ARROW_DOWN, KEY.SPACE, KEY.ESCAPE], handleKeyDown, {
    target: wrapperRef,
  });

  const handleHover = (isExpanded: boolean) => {
    isInternalExpand && shouldToggleOnHover && setExpanded(isExpanded);
  };

  const handleFocus = () => !hasFocus && setHasFocus(true);

  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget) && isInternalExpand) {
      setHasFocus(false);
      setExpanded(false);
    }
  };

  const handleMouseEnter = () => handleHover(true);

  const handleMouseLeave = () => handleHover(false);

  const toggleExpanded = () => {
    isInternalExpand && setExpanded(isLoading || disabled ? false : !expanded);
  };

  const handleClearSelected = useCallback(
    (e) => {
      e.stopPropagation();
      onChange([]);
      isInternalExpand && setExpanded(false);
    },
    [onChange, isInternalExpand]
  );

  return (
    <div
      tabIndex={0}
      className="dropdown-container"
      aria-labelledby={labelledBy}
      aria-expanded={expanded}
      aria-readonly={true}
      aria-disabled={disabled}
      ref={wrapperRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="dropdown-heading" onClick={toggleExpanded}>
        <div className="dropdown-heading-value">
          <DropdownHeader />
        </div>
        {isLoading && <Loading />}
        {value.length > 0 && ClearSelectedIcon !== null && (
          <button
            type="button"
            className="clear-selected-button"
            onClick={handleClearSelected}
            disabled={disabled}
            aria-label={t("clearSelected")}
          >
            {ClearSelectedIcon || <Cross />}
          </button>
        )}
        <FinalArrow expanded={expanded} />
      </div>
      {expanded && (
        <div className="dropdown-content">
          <div className="panel-content">
            <SelectPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
