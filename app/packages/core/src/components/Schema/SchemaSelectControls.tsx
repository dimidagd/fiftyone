import React, { useMemo } from "react";
import { Box, FormControlLabel, FormGroup, Switch } from "@mui/material";

import { useSchemaSettings } from "@fiftyone/state";
import styled from "styled-components";

const ContainerBox = styled(Box)`
  position: relative;
  display: flex;
  color: ${({ theme }) => theme.text.primary};
  box-shadow: ${({ theme }) => `0px 1px 2px ${theme.divider}`};
  padding: 0.35rem 1rem;
`;

export const SchemaSelectionControls = () => {
  const {
    showNestedFields,
    setShowNestedFields,
    allFieldsChecked,
    setAllFieldsChecked,
    isFilterRuleActive,
    showMetadata,
    setShowMetadata,
    searchResults,
    includeNestedFields,
    setIncludeNestedFields,
  } = useSchemaSettings();
  const showMetadataVisible = !!!(isFilterRuleActive && !searchResults.length);
  const includeNestedVisible = !!(isFilterRuleActive && searchResults.length);

  const controlList = useMemo(() => {
    return [
      {
        label: "Show metadata",
        isVisible: showMetadataVisible,
        value: showMetadata,
        checked: showMetadata,
        onChange: () => setShowMetadata(!showMetadata),
      },
      {
        label: "Include nested fields",
        isVisible: includeNestedVisible,
        value: includeNestedFields,
        checked: includeNestedFields,
        onChange: () => setIncludeNestedFields(!includeNestedFields),
        disabled: !searchResults.length,
      },
      {
        label: "Show nested fields",
        isVisible: !isFilterRuleActive,
        value: showNestedFields,
        checked: showNestedFields,
        onChange: () => setShowNestedFields(!showNestedFields),
      },
      {
        label: "Select all",
        isVisible: !isFilterRuleActive,
        value: allFieldsChecked,
        checked: allFieldsChecked,
        onChange: () => setAllFieldsChecked(!allFieldsChecked),
      },
    ];
  }, [
    showMetadata,
    showMetadataVisible,
    includeNestedFields,
    showNestedFields,
    allFieldsChecked,
  ]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{ position: "relative !important" }}
    >
      <Box display="flex" width="100%" flexDirection="row" marginTop="1rem">
        {controlList
          .filter(({ isVisible }) => isVisible)
          .map(({ label, value, checked, onChange, disabled = false }) => (
            <ContainerBox key={label} flex="1">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      value={value}
                      checked={checked}
                      onChange={onChange}
                      disabled={disabled}
                    />
                  }
                  label={label}
                  sx={{ letterSpacing: "0.05rem" }}
                />
              </FormGroup>
            </ContainerBox>
          ))}
      </Box>
    </Box>
  );
};
