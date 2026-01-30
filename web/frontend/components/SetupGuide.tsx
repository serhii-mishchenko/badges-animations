import { useMixpanel } from '@/hooks/useMixpanel';
import { useNavigate } from '@/hooks/useNavigations';
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Divider,
  Icon,
  IconSource,
  InlineStack,
  Layout,
  ProgressBar,
  Text,
} from '@shopify/polaris';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LayoutBlockIcon,
  XIcon,
} from '@shopify/polaris-icons';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSettingsContext } from '@/components/providers/SettingsProvider/SettingsProvider';
import { useAppBridge } from '@shopify/app-bridge-react';

interface StepAction {
  name: string,
  url?: string,
  onClick: () => void
}

interface Step {
  id: string,
  title: string,
  completed: boolean,
  action?: StepAction,
  content?: string,
  selected?: boolean,
  secondaryAction?: StepAction,
  onClick?: () => void
}

// ------------------------------------------------------------ Helpers ------------------------------------------------------------

function TaskIcon({ completed }: { completed: boolean }): JSX.Element {
  return (
    <Icon
      source={completed ? CheckCircleIcon as IconSource : LayoutBlockIcon as IconSource}
      tone={completed ? 'success' : 'subdued'}
    />
  );
}

function TaskItem(step: Step): JSX.Element {
  return (
    <Box 
      onClick={step.onClick}
      background={step.selected ? 'bg-surface-secondary' : undefined}
      padding={'200'}
      borderRadius={step.selected ? '200' : undefined}
    >
      <div className={`task-item ${step.selected ? 'task-item-selected' : ''}`}>
        <BlockStack>
          <InlineStack blockAlign='center'>
            <Box 
              minWidth='30px' 
              minHeight='30px' 
              paddingInlineEnd='200'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '4px',
              }}
            >
              <TaskIcon completed={step.completed} />
            </Box>
            <Text as='span' variant='bodyLg'>
              {step.title}
            </Text>
          </InlineStack>
          {step.selected && step.content && (
            <Box
              paddingBlockEnd='200'
              paddingBlockStart='200'
              paddingInline='400'
              paddingInlineStart='1000'
            >
              <BlockStack gap='200'>
                <Text as='span' tone='subdued'>
                  {step.content}
                </Text>
                {step.action && (
                  <Box>
                    <InlineStack gap='200'>
                      <Button
                        onClick={step.action?.onClick || (() => {})}
                        url={step.action?.url || ''}
                        variant='primary'
                      >
                        {step.action?.name || ''}
                      </Button>
                      {step.secondaryAction && (
                        <Button
                          onClick={step.secondaryAction?.onClick || (() => {})}
                          url={step.secondaryAction?.url || ''}
                          variant='secondary'
                        >
                          {step.secondaryAction?.name || ''}
                        </Button>
                      )}
                    </InlineStack>
                  </Box>
                )}
              </BlockStack>
            </Box>
          )}
        </BlockStack>
      </div>
    </Box>
  );
}

// ------------------------------------------------------------ Steps ------------------------------------------------------------

const makeSteps = (
  appEmbedsStatus: boolean,
  navigateToAppEmbeded: () => void,
  trackEvent: (event: string) => void
): Step[] => {
  return [
    {
      id: 'app_installed',
      title: 'Install App',
      completed: true,
    },
    {
      id: 'embedded_app',
      title: 'Activate App Embed Block',
      completed: appEmbedsStatus,
      action: {
        name: 'Activate',
        onClick: () => {
          trackEvent('Activate App Embed Block from Setup Guide');
          navigateToAppEmbeded();
        },
      },
      content:
        "Turn on the App Embed Block. Typically, the app functions smoothly with all themes, but occasionally, due to custom modifications or interactions with other apps, our script may fail to add a badge properly. In this case, please, try to activate the App Embed Block again.",
    },
  ];
}

export function SetupGuide({ appEmbedsStatus, isLoadingAppEmbedsStatus }: { appEmbedsStatus: boolean; isLoadingAppEmbedsStatus: boolean }) {
  // Get settings from context - useSettingsContext always returns a valid value
  const contextValue = useSettingsContext();
  const shopify = useAppBridge();
  const { navigateToAppEmbeded } = useNavigate();
  const { trackEvent } = useMixpanel();
  const updateSettings = contextValue.updateSettings;

  // Get settings from context
  const collapseSetupGuide = contextValue.settings.collapseSetupGuide;
  const hideSetupGuide = contextValue.settings.hideSetupGuide;
  const loaded = contextValue.settings.loaded;

  // Memoize STEPS to prevent recreation on every render
  const STEPS: Step[] = useMemo(() => makeSteps(
    appEmbedsStatus,
    navigateToAppEmbeded,
    trackEvent
  ), [appEmbedsStatus, navigateToAppEmbeded, trackEvent]);

  // Memoize getDefaultStep to prevent recreation
  const getDefaultStep = useCallback(() => {
    return STEPS.find((step) => !step.completed) || STEPS[0];
  }, [STEPS]);

  const [selectedStep, setSelectedStep] = useState(() => getDefaultStep());

  const hideSetupGuideFn = () => {
    trackEvent('Hide Setup Guide');
    updateSettings({ hideSetupGuide: true });
  }

  const collapseSetupGuideFn = () => {
    trackEvent('Collapse Setup Guide');
    updateSettings({ collapseSetupGuide: true });
  }

  const expandSetupGuideFn = () => {
    trackEvent('Expand Setup Guide');
    updateSettings({ collapseSetupGuide: false });
  }

  const calculateProgress = () => {
    const completedSteps = STEPS.reduce(
      (count, step) => count + (step.completed ? 1 : 0),
      0,
    );
    const progress = (completedSteps / STEPS.length) * 100;

    return progress;
  }

  const progress = calculateProgress();
  const completedStepsNumber = STEPS.filter((s) => s.completed).length;
  const allStepsNumber = STEPS.length;
  const isCompleted = progress == 100;

  // Update selected step when appEmbedsStatus changes
  // useEffect(() => {
  //   const newDefaultStep = getDefaultStep();
  //   if (selectedStep.id !== newDefaultStep.id) {
  //     setSelectedStep(newDefaultStep);
  //   }
  // }, [appEmbedsStatus, selectedStep.id]);

  // Handle completion separately to avoid infinite loops
  useEffect(() => {
    if (isCompleted && !hideSetupGuide) {
      trackEvent('Setup Guide Completed');
      shopify.toast.show('Setup Guide Completed');
      updateSettings({ hideSetupGuide: true }, { showToast: false });
    }
  }, [isCompleted, hideSetupGuide, trackEvent, shopify, updateSettings]);

  if (!loaded || isLoadingAppEmbedsStatus) {
    return (
      <Layout.Section>
        <Banner title='Loading...' tone='info'></Banner>
      </Layout.Section>
    );
  } else if (hideSetupGuide) {
    if (appEmbedsStatus) {
      return (
        <Layout.Section>
          <Banner title='The App Embed is activated' tone='success'></Banner>
        </Layout.Section>
      );
    } else {
      return (
        <Layout.Section>
          <Banner
            action={{
              content: 'Activate',
              onAction: () => {
                trackEvent('Activate App Embed Block');
                navigateToAppEmbeded();
              },
            }}
            title='The App Embed Block is not activated'
            tone='warning'
          >
            <Text as='p'>
              The App Embed Block is not activated. Please activate it to use
              our application. Don`t forget to press "Save" after activation.
            </Text>
          </Banner>
        </Layout.Section>
      );
    }
  }

  return (
    <Layout.Section>
      <Card>
        <BlockStack gap='200'>
          {/* Setup Guide Header with buttons to collapse and hide the guide */}
          <InlineStack align='space-between'>
            <InlineStack blockAlign='center' gap='400'>
              <Text as='h6' variant='headingMd'>
                Setup guide
              </Text>
              <InlineStack blockAlign='center' gap='100'>
                <Badge>{`${completedStepsNumber} / ${allStepsNumber} completed`}</Badge>
                {isCompleted && (
                  <div className='setup-guide-ok'>
                    <Icon source={CheckCircleIcon as IconSource} tone={'success'} />
                  </div>
                )}
              </InlineStack>
            </InlineStack>
            <ButtonGroup>
              <Button
                icon={
                  collapseSetupGuide ||
                  typeof collapseSetupGuide === 'undefined'
                    ? ChevronDownIcon
                    : ChevronUpIcon
                }
                onClick={
                  collapseSetupGuide ||
                  typeof collapseSetupGuide === 'undefined'
                    ? expandSetupGuideFn
                    : collapseSetupGuideFn
                }
                variant='plain'
              />
              <Button icon={XIcon} onClick={hideSetupGuideFn} variant='plain' />
            </ButtonGroup>
          </InlineStack>
          
          {/* Progress Bar to show the progress of the setup guide */}
          <ProgressBar
            progress={progress}
            size='small'
            tone={isCompleted ? 'success' : 'primary'}
          />

          <InlineStack align='space-between'></InlineStack>

          {/* Steps list */}
          {!collapseSetupGuide && (
            <>
              <Divider></Divider>
              <BlockStack gap='100'>
                {STEPS.map((step, index) => (
                  <TaskItem
                    id={step.id}
                    action={step.action}
                    completed={step.completed}
                    content={step.content || ''}
                    key={index}
                    onClick={() => setSelectedStep(step)}
                    secondaryAction={step.secondaryAction}
                    selected={selectedStep.id == step.id}
                    title={step.title}
                  />
                ))}
              </BlockStack>
            </>
          )}
        </BlockStack>
      </Card>
    </Layout.Section>
  );
}
