import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";

type LessonWordsHeaderProps = {
  palaceId: string;
  palaceName: string;
  lessonTitle: string;
  onBack: () => void;
};

export function LessonWordsHeader({ onBack }: LessonWordsHeaderProps) {
  return (
    <>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ width: "fit-content" }}
      >
        Back to Palace Details
      </Button>
    </>
  );
}
