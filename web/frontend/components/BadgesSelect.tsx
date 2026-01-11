import { Button, Popover, ActionList, InlineStack } from '@shopify/polaris';
import type { ActionListItemDescriptor } from '@shopify/polaris';
import type { BadgesSelectProps, BadgeOption } from './types';
import { useCallback, useEffect, useState } from 'react';

export function BadgesSelect(
  { options, selectedId, onChange }: BadgesSelectProps
) {
  const [popoverActive, setPopoverActive] = useState(false);
  const [selectedOption, setSelectedOption] = useState<BadgeOption | null>(null);

  // Set the selected option when the selectedId changes
  useEffect(() => {
    setSelectedOption(options.find((option) => option.id === selectedId) ?? null);
  }, [selectedId]);

  // Create the choices for the popover
  const choices: ActionListItemDescriptor[] = options.map((option) => ({
    id: option.id,
    content: option.title,
    image: option.source,
    onAction: () => {
      setSelectedOption(option);
      setPopoverActive(false);
      onChange(option.id);
    },
    active: option.id === selectedId,
  }));

  // Toggle the popover active state
  const togglePopoverActive = useCallback(
    () => setPopoverActive((popoverActive) => !popoverActive),
    [],
  );

  // The activator for the popover
  const activator = (
    <Button
      onClick={togglePopoverActive}
      disclosure
      fullWidth
      align="left"
    >
      <InlineStack blockAlign="center" gap="200">
        {selectedOption?.source && (
          <img
            src={selectedOption.source}
            alt={selectedOption.alt}
            style={{
              width: "24px",
              height: "24px",
              objectFit: "contain",
              display: "block",
            }}
          />
        )}
        <span>{selectedOption?.title ?? "None"}</span>
      </InlineStack>
    </Button>
  );

  return (
    <Popover
      active={popoverActive}
      preferredPosition="below"
      preferredAlignment="left"
      activator={activator}
      onClose={togglePopoverActive}
    >
      <ActionList
        actionRole="menuitem"
        items={choices}
      />
    </Popover>
  );
}
