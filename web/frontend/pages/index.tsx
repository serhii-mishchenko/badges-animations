import { useState, useEffect } from "react";
import {
  Card,
  Page,
  Layout,
  Text,
  Banner,
  Image,
  BlockStack,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useQuery, useMutation, useQueryClient } from "react-query";

import {
  bestBadge,
  ecoBadge,
  exclusiveBadge,
  handmadeBadge,
  limitedBadge,
  newBadge,
  preorderBadge,
  saleBadge,
  topBadge,
} from "../assets";
import { BadgesSelect } from "../components/BadgesSelect";
import { BadgeOption } from "../components/types";
import { useGetAppEmbedsStatus } from "@/hooks/api/useSettingsApi";
// import { rails2TsxParameters } from '@/shared/utils/transformers';
import { SetupGuide } from '@/components/SetupGuide';

// interface BadgeOption {
//   label: string;
//   value: string;
//   image: string | null;
// }

const BADGE_OPTIONS: BadgeOption[] = [
  { id: "none", source: '', alt: "None", title: "None", description: null },
  { id: "best", source: bestBadge, alt: "Best", title: "Best", description: null },
  { id: "eco", source: ecoBadge, alt: "Eco", title: "Eco", description: null },
  { id: "exclusive", source: exclusiveBadge, alt: "Exclusive", title: "Exclusive", description: null },
  { id: "handmade", source: handmadeBadge, alt: "Handmade", title: "Handmade", description: null },
  { id: "limited", source: limitedBadge, alt: "Limited", title: "Limited", description: null },
  { id: "new", source: newBadge, alt: "New", title: "New", description: null },
  { id: "preorder", source: preorderBadge, alt: "Preorder", title: "Preorder", description: null },
  { id: "sale", source: saleBadge, alt: "Sale", title: "Sale", description: null },
  { id: "top", source: topBadge, alt: "Top", title: "Top", description: null },
];

const BADGE_IMAGES: Record<string, string> = {
  best: bestBadge,
  eco: ecoBadge,
  exclusive: exclusiveBadge,
  handmade: handmadeBadge,
  limited: limitedBadge,
  new: newBadge,
  preorder: preorderBadge,
  sale: saleBadge,
  top: topBadge,
};

interface BadgeData {
  badge: string;
}

// const makeInitSettings = () => {
//   if (!window.BadgesAnimationHomePage) return null;

//   const settings = {
//     ...rails2TsxParameters(window.BadgesAnimationHomePage),
//   };

//   window.BadgesAnimationHomePage = null;

//   return settings;
// };

export default function HomePage() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const queryClient = useQueryClient();
  const [selectedBadge, setSelectedBadge] = useState<string>("none");
  // const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const {
    data: badgeData,
    isLoading: isLoadingBadge,
  } = useQuery<BadgeData>({
    queryKey: ["badgeSetting"],
    queryFn: async () => {
      const response = await fetch("/api/settings/badge");
      if (!response.ok) {
        throw new Error("Failed to fetch badge setting");
      }
      return await response.json();
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (badgeData?.badge) {
      setSelectedBadge(badgeData.badge);
    }
  }, [badgeData]);

  const saveMutation = useMutation({
    mutationFn: async (badge: string) => {
      const response = await fetch("/api/settings/badge", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ badge }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save badge setting");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["badgeSetting"]);
      shopify.toast.show(t("BadgeSettings.savedSuccessfully"));
    },
    onError: (error: Error) => {
      shopify.toast.show(error.message || t("BadgeSettings.saveError"), {
        isError: true,
      });
    },
  });

  const handleBadgeChange = (value: string) => {
    setSelectedBadge(value);
  };

  const handleSave = () => {
    saveMutation.mutate(selectedBadge);
  };

  const pageActions = [
    {
      content: t("BadgeSettings.saveButton"),
      onAction: handleSave,
      loading: saveMutation.isLoading,
      disabled: isLoadingBadge,
      primary: true,
    },
  ];

  const { data: currentAppEmbedsStatus, isLoading: isLoadingAppEmbedsStatus } = useGetAppEmbedsStatus();
  const appEmbedsStatus = currentAppEmbedsStatus || false;

  return (
    <Page
      narrowWidth
      title={t("BadgeSettings.title")}
      primaryAction={pageActions[0]}
    >
      <TitleBar title={t("BadgeSettings.title")} />
      <SetupGuide appEmbedsStatus={appEmbedsStatus} isLoadingAppEmbedsStatus={isLoadingAppEmbedsStatus} />
      <Layout.Section>
        <Card sectioned>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              {t("BadgeSettings.heading")}
            </Text>
            <Banner status="info">
              <p>{t("BadgeSettings.description")}</p>
            </Banner>
          </BlockStack>
        </Card>
      </Layout.Section>
      <Layout.Section>
        <Card>
          <BlockStack gap="200">
            <BlockStack gap="400">
              <Text as="label" variant="headingSm">
                {t("BadgeSettings.selectLabel")}
              </Text>
              <BadgesSelect
                options={BADGE_OPTIONS}
                selectedId={selectedBadge}
                onChange={handleBadgeChange}
              />
              <Text as="span" variant="bodySm" tone="subdued">
                {t("BadgeSettings.selectHelpText")}
              </Text>
            </BlockStack>
            {selectedBadge !== "none" && BADGE_IMAGES[selectedBadge] && (
              <>
                <Divider />
                <Text as="h3" variant="headingSm">
                  {t("BadgeSettings.previewLabel")}
                </Text>
                <BlockStack gap="base" align="center">
                  <div style={{ maxWidth: "200px", margin: "0 auto" }}>
                    <Image
                      source={BADGE_IMAGES[selectedBadge]}
                      alt={selectedBadge}
                      width={200}
                    />
                  </div>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {t("BadgeSettings.previewDescription")}
                  </Text>
                </BlockStack>
              </>
            )}
          </BlockStack>
        </Card>
      </Layout.Section>
    </Page>
  );
}
