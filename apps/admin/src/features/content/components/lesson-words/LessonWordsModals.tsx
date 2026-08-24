import { ModalForm, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import type { WordDto } from '../../../../types/content';

type WordFormValues = {
  locationId: string;
  text: string;
  meaning?: string;
};

type LocationOption = {
  label: ReactNode;
  value: string;
  title: string;
};

type LessonWordsModalsProps = {
  createOpen: boolean;
  batchOpen: boolean;
  editingWord: WordDto | null;
  locationOptions: LocationOption[];
  onCreateOpenChange: (open: boolean) => void;
  onBatchOpenChange: (open: boolean) => void;
  onEditingWordChange: (word: WordDto | null) => void;
  onCreateWord: (values: WordFormValues) => Promise<void>;
  onUpdateWord: (wordId: string, values: WordFormValues) => Promise<boolean>;
  onBatchSubmit: (lines: string) => Promise<boolean>;
};

export function LessonWordsModals({
  createOpen,
  batchOpen,
  editingWord,
  locationOptions,
  onCreateOpenChange,
  onBatchOpenChange,
  onEditingWordChange,
  onCreateWord,
  onUpdateWord,
  onBatchSubmit,
}: LessonWordsModalsProps) {
  return (
    <>
      <ModalForm<WordFormValues>
        title='Create Word'
        open={createOpen}
        modalProps={{ destroyOnClose: true }}
        layout='horizontal'
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        onOpenChange={onCreateOpenChange}
        onFinish={async (values) => {
          await onCreateWord(values);
          return true;
        }}
      >
        <ProFormSelect
          name='locationId'
          label='Location'
          placeholder='Select a location'
          options={locationOptions}
          fieldProps={{ showSearch: true, optionFilterProp: 'title', placeholder: 'Select a location' }}
          rules={[{ required: true }]}
        />
        <ProFormText
          name='text'
          label='Word'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter word (e.g., Lantern)' }}
        />
        <ProFormText name='meaning' label='Meaning' fieldProps={{ placeholder: 'Enter meaning (optional)' }} />
      </ModalForm>

      <ModalForm<{ lines: string }>
        title='Batch Add Words'
        open={batchOpen}
        modalProps={{ destroyOnClose: true }}
        layout='horizontal'
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        onOpenChange={onBatchOpenChange}
        onFinish={async (values) => {
          return await onBatchSubmit(values.lines);
        }}
      >
        <ProFormTextArea
          name='lines'
          label='Words'
          fieldProps={{
            rows: 8,
            placeholder: 'apple | a fruit\nanchor | something that holds steady',
          }}
          extra='One line per word. Format: word | meaning (meaning is optional).'
          rules={[{ required: true }]}
        />
      </ModalForm>

      <ModalForm<WordFormValues>
        key={editingWord?.id ?? 'edit-word'}
        title='Edit Word'
        open={!!editingWord}
        modalProps={{ destroyOnClose: true }}
        layout='horizontal'
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        initialValues={
          editingWord
            ? {
                locationId: editingWord.locationId,
                text: editingWord.text,
                meaning: editingWord.meaning ?? '',
              }
            : undefined
        }
        onOpenChange={(isOpen) => {
          if (!isOpen) onEditingWordChange(null);
        }}
        onFinish={async (values) => {
          if (!editingWord) return false;
          return await onUpdateWord(editingWord.id, values);
        }}
      >
        <ProFormSelect
          name='locationId'
          label='Location'
          placeholder='Select a location'
          options={locationOptions}
          fieldProps={{ showSearch: true, optionFilterProp: 'title', placeholder: 'Select a location' }}
          rules={[{ required: true }]}
        />
        <ProFormText
          name='text'
          label='Word'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter word (e.g., Lantern)' }}
        />
        <ProFormText name='meaning' label='Meaning' fieldProps={{ placeholder: 'Enter meaning (optional)' }} />
      </ModalForm>
    </>
  );
}
