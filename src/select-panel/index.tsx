/**
 * This component represents the entire panel which gets dropped down when the
 * user selects the component.  It encapsulates the search filter, the
 * Select-all item, and the list of options.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useKey } from "../hooks/use-key";
import { useMultiSelect } from "../hooks/use-multi-select";
import { KEY } from "../lib/constants";
import { debounce } from "../lib/debounce";
import { filterOptions } from "../lib/simple-match-utils";
import { Cross } from "./cross";
import SelectItem from "./select-item";
import SelectList from "./select-list";

enum FocusType {
  SEARCH = 0,
  NONE = -1,
}

const SelectPanel = () => {
  const {
    t,
    onChange,
    options,
    setOptions,
    value,
    filterOptions: customFilterOptions,
    ItemRenderer,
    disabled,
    disableSearch,
    hasSelectAll,
    ClearIcon,
    debounceDuration,
    isCreatable,
    onCreateOption,
  } = useMultiSelect();

  const listRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [searchTextForFilter, setSearchTextForFilter] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const debouncedSearch = useCallback(
    debounce(
      (query: string) => setSearchTextForFilter(query),
      debounceDuration
    ),
    []
  );

  const skipIndex = useMemo(() => {
    let start = 0;

    if (!disableSearch) start += 1; // if search is enabled then +1 to skipIndex
    if (hasSelectAll) start += 1; // if select-all is enabled then +1 to skipIndex

    return start;
  }, [disableSearch, hasSelectAll]);

  const selectAllOption = {
    label: searchText ? t("selectAllFiltered") : t("selectAll"),
    value: "",
  };

  const selectAllValues = (checked: boolean) => {
    const filteredValues = filteredOptions
      .filter((o) => !o.disabled)
      .map((o) => o.value);

    if (checked) {
      const selectedValues = value.map((o) => o.value);
      const finalSelectedValues = [...selectedValues, ...filteredValues];

      return (customFilterOptions ? filteredOptions : options).filter((o) =>
        finalSelectedValues.includes(o.value)
      );
    }

    return value.filter((o) => !filteredValues.includes(o.value));
  };

  const selectAllChanged = (checked: boolean) => {
    const newOptions = selectAllValues(checked);
    onChange(newOptions);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    debouncedSearch(e.target.value);
    setSearchText(e.target.value);
    setFocusIndex(FocusType.SEARCH);
  };

  const handleClear = (): void => {
    setSearchTextForFilter("");
    setSearchText("");
    searchInputRef?.current?.focus();
  };

  const handleItemClicked = (index: number) => setFocusIndex(index);

  // Arrow Key Navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case KEY.ARROW_UP:
        updateFocus(-1);
        break;
      case KEY.ARROW_DOWN:
        updateFocus(1);
        break;
      default:
        return;
    }
    e.stopPropagation();
    e.preventDefault();
  };

  useKey([KEY.ARROW_DOWN, KEY.ARROW_UP], handleKeyDown, {
    target: listRef,
  });

  const handleSearchFocus = () => {
    setFocusIndex(FocusType.SEARCH);
  };

  const handleOnCreateOption = async () => {
    let newOption = { label: searchText, value: searchText, __isNew__: true };

    // if custom `onCreateOption` is given then this will call this
    if (onCreateOption) {
      newOption = await onCreateOption(searchText);
    }

    // adds created value to existing options
    setOptions([newOption, ...options]);
    handleClear();

    onChange([...value, newOption]);
  };

  const getFilteredOptions = async () =>
    customFilterOptions
      ? await customFilterOptions(options, searchTextForFilter)
      : filterOptions(options, searchTextForFilter);

  const updateFocus = (offset: number) => {
    let newFocus = focusIndex + offset;
    newFocus = Math.max(0, newFocus);
    newFocus = Math.min(newFocus, options.length + Math.max(skipIndex - 1, 0));
    setFocusIndex(newFocus);
  };

  useEffect(() => {
    listRef?.current?.querySelector(`[tabIndex='${focusIndex}']`)?.focus();
  }, [focusIndex]);

  const [isAllOptionSelected, hasSelectableOptions] = useMemo(() => {
    const filteredOptionsList = filteredOptions.filter((o) => !o.disabled);
    return [
      filteredOptionsList.every(
        (o) => value.findIndex((v) => v.value === o.value) !== -1
      ),
      filteredOptionsList.length !== 0,
    ];
    // eslint-disable-next-line
  }, [filteredOptions, value]);

  useEffect(() => {
    getFilteredOptions().then(setFilteredOptions);
  }, [searchTextForFilter, options]);

  const creationRef: any = useRef(null);
  useKey([KEY.ENTER], handleOnCreateOption, { target: creationRef });

  const showCreatable =
    isCreatable &&
    searchText &&
    !filteredOptions.some((e) => e?.value === searchText);

  return (
    <div className="select-panel" role="listbox" ref={listRef}>
      {!disableSearch && (
        <div className="search">
          <input
            placeholder={t("search")}
            type="text"
            aria-describedby={t("search")}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            value={searchText}
            ref={searchInputRef}
            tabIndex={0}
          />
          <button
            type="button"
            className="search-clear-button"
            hidden={!searchText}
            onClick={handleClear}
            aria-label={t("clearSearch")}
          >
            {ClearIcon || <Cross />}
          </button>
        </div>
      )}

      <ul className="options">
        {hasSelectAll && hasSelectableOptions && (
          <SelectItem
            tabIndex={skipIndex === 1 ? 0 : 1}
            checked={isAllOptionSelected}
            option={selectAllOption}
            onSelectionChanged={selectAllChanged}
            onClick={() => handleItemClicked(1)}
            itemRenderer={ItemRenderer}
            disabled={disabled}
          />
        )}

        {filteredOptions.length ? (
          <SelectList
            skipIndex={skipIndex}
            options={filteredOptions}
            onClick={(_e, index) => handleItemClicked(index)}
          />
        ) : showCreatable ? (
          <li
            onClick={handleOnCreateOption}
            className="select-item creatable"
            tabIndex={1}
            ref={creationRef}
          >
            {`${t("create")} "${searchText}"`}
          </li>
        ) : (
          <li className="no-options">{t("noOptions")}</li>
        )}
      </ul>
    </div>
  );
};

export default SelectPanel;
