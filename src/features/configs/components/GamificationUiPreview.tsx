import React from "react";
import { Card, Space, Tag, Divider, Row, Col, Empty } from "antd";
import type { GamificationMobileUiConfig } from "../../../schemas/systemSettings";

interface GamificationUiPreviewProps {
  config: GamificationMobileUiConfig;
}

/**
 * Live preview component for Gamification UI configuration
 * Shows how the configuration will appear in the mobile app
 */
export const GamificationUiPreview: React.FC<GamificationUiPreviewProps> = ({
  config,
}) => {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card title="Mobile App Preview" type="inner">
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* Home Screen Preview */}
          <Card
            size="small"
            title="Home Screen - Mission Card"
            style={{ backgroundColor: "#f5f5f5" }}
          >
            <div
              style={{ padding: 16, backgroundColor: "#fff", borderRadius: 8 }}
            >
              <h4 style={{ margin: "0 0 8px 0" }}>
                {config.homeMissionCardTitle}
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                {config.homeMissionCardDescription}
              </p>
            </div>
          </Card>

          {/* Mission Screen Preview */}
          <Card
            size="small"
            title="Mission Screen"
            style={{ backgroundColor: "#f5f5f5" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>
                  {config.missionScreenTitle}
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                  {config.missionScreenDescription}
                </p>
              </div>

              <Divider style={{ margin: "8px 0" }} />

              {/* Mission Section */}
              <div>
                <h4 style={{ margin: "0 0 8px 0" }}>
                  {config.missionSectionTitle}
                </h4>
                <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#666" }}>
                  {config.missionSectionDescription}
                </p>
                <div
                  style={{
                    padding: 8,
                    backgroundColor: "#fafafa",
                    borderRadius: 4,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 11, color: "#999" }}>
                    [Mission items would appear here - preview shows{" "}
                    {config.homeMissionPreviewCount} missions on home]
                  </p>
                </div>
              </div>

              <Divider style={{ margin: "8px 0" }} />

              {/* Sections Grid */}
              <Row gutter={16}>
                <Col xs={12}>
                  <div
                    style={{
                      padding: 8,
                      backgroundColor: "#e6f7ff",
                      borderRadius: 4,
                    }}
                  >
                    <h5 style={{ margin: "0 0 4px 0", fontSize: 12 }}>
                      {config.badgeSectionTitle}
                    </h5>
                    <p style={{ margin: 0, fontSize: 10, color: "#0050b3" }}>
                      [Badges section]
                    </p>
                  </div>
                </Col>
                <Col xs={12}>
                  <div
                    style={{
                      padding: 8,
                      backgroundColor: "#f6f8fb",
                      borderRadius: 4,
                    }}
                  >
                    <h5 style={{ margin: "0 0 4px 0", fontSize: 12 }}>
                      {config.milestoneSectionTitle}
                    </h5>
                    <p style={{ margin: 0, fontSize: 10, color: "#595959" }}>
                      [Milestones section]
                    </p>
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Milestone Type Labels Preview */}
          <Card
            size="small"
            title="Milestone Type Labels"
            style={{ backgroundColor: "#f5f5f5" }}
          >
            {Object.entries(config.milestoneTypeLabels).length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(config.milestoneTypeLabels).map(
                  ([key, label]) => (
                    <Tag key={key} color="blue">
                      <span style={{ fontSize: 11 }}>
                        <strong>{key}</strong>: {label}
                      </span>
                    </Tag>
                  ),
                )}
              </div>
            ) : (
              <Empty
                description="No milestone labels defined"
                style={{ marginTop: 16 }}
              />
            )}
          </Card>

          {/* Configuration Summary */}
          <Card
            size="small"
            title="Configuration Summary"
            style={{ backgroundColor: "#f5f5f5" }}
          >
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <p>
                <strong>Home Mission Preview Count:</strong>{" "}
                {config.homeMissionPreviewCount} missions
              </p>
              <p>
                <strong>Sections:</strong> Missions, Badges, Milestones
              </p>
              <p>
                <strong>Milestone Types:</strong>{" "}
                {Object.keys(config.milestoneTypeLabels).length}
              </p>
            </div>
          </Card>
        </Space>
      </Card>
    </Space>
  );
};

export default GamificationUiPreview;
