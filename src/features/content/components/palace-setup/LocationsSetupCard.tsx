import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  DragSortTable,
  ModalForm,
  ProForm,
  ProTable,
  ProFormText,
} from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Popconfirm, Space, message } from 'antd';
import { useMemo, useState } from 'react';
import { adminContentApi } from '../../../../api/adminContentApi';
import type { LocationDto, LocationUpsertRequest } from '../../../../types/content';
import { ImageUploadField } from '../ImageUploadField';
import { MediaThumbnail } from '../MediaThumbnail';
import { buildLocationPayload, type LocationFormValues } from './forms';

interface LocationsSetupCardProps {
  palaceId: string;
  locations: LocationDto[];
  loading?: boolean;
  onChanged: () => Promise<void> | void;
  editable?: boolean;
}

export function LocationsSetupCard({ palaceId, locations, loading, onChanged, editable = true }: LocationsSetupCardProps) {
  const [editingLocation, setEditingLocation] = useState<LocationDto | null>(null);
  const [createLocationOpen, setCreateLocationOpen] = useState(false);
  const [reorderDraft, setReorderDraft] = useState<LocationDto[] | null>(null);
  const formLayout = { layout: 'horizontal' as const, labelCol: { span: 7 }, wrapperCol: { span: 17 } };

  const displayedRows = reorderDraft ?? locations;
  const hasOrderChanges =
    reorderDraft !== null &&
    reorderDraft.some((location, index) => location.id !== locations[index]?.id || location.position !== index + 1);

  const createLocationMutation = useMutation({
    mutationFn: (payload: LocationUpsertRequest) => adminContentApi.createLocation(payload),
    onSuccess: async () => {
      message.success('Location created.');
      setCreateLocationOpen(false);
      setReorderDraft(null);
      await onChanged();
    },
    onError: () => message.error('Failed to create location.'),
  });

  const updateLocationMutation = useMutation({
    mutationFn: (args: { id: string; payload: LocationUpsertRequest }) =>
      adminContentApi.updateLocation(args.id, args.payload),
    onSuccess: async () => {
      message.success('Location updated.');
      setEditingLocation(null);
      setReorderDraft(null);
      await onChanged();
    },
    onError: () => message.error('Failed to update location.'),
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => adminContentApi.deleteLocation(id),
    onSuccess: async () => {
      message.success('Location deleted.');
      setReorderDraft(null);
      await onChanged();
    },
    onError: () => message.error('Failed to delete location.'),
  });

  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      if (!reorderDraft) return;
      const locationIds = reorderDraft.map((location) => location.id);
      if (locationIds.length === 0) return;
      await adminContentApi.reorderLocations(palaceId, { locationIds });
    },
    onSuccess: async () => {
      message.success('Location order saved.');
      setReorderDraft(null);
      await onChanged();
    },
    onError: () => message.error('Failed to save location order.'),
  });

  const columns: ProColumns<LocationDto>[] = useMemo(
    () => [
      {
        title: '',
        dataIndex: 'sort',
        width: 56,
        className: 'drag-visible',
      },
      { title: 'Position', dataIndex: 'position', width: 90 },
      { title: 'Name', dataIndex: 'name' },
      { title: 'Description', dataIndex: 'description', ellipsis: true },
      {
        title: 'Image',
        dataIndex: 'imageUrl',
        width: 120,
        render: (_, row) => (
          <MediaThumbnail path={row.imageUrl} alt={`${row.name} image`} width={92} height={56} />
        ),
      },
      {
        title: 'Actions',
        valueType: 'option',
        width: 120,
        render: (_, row) => [
          <Button key='edit' size='small' icon={<EditOutlined />} onClick={() => setEditingLocation(row)} />,
          <Popconfirm
            key='delete'
            title='Delete this location?'
            onConfirm={() => deleteLocationMutation.mutate(row.id)}
          >
            <Button size='small' danger icon={<DeleteOutlined />} />
          </Popconfirm>,
        ],
      },
    ],
    [deleteLocationMutation]
  );

  const readOnlyColumns: ProColumns<LocationDto>[] = useMemo(
    () => columns.filter((column) => column.dataIndex !== 'sort' && column.valueType !== 'option'),
    [columns]
  );

  return (
    <Card
      title='Locations'
      extra={
        editable ? (
          <Space>
            {hasOrderChanges ? (
              <>
                <Button onClick={() => setReorderDraft(null)}>Reset Order</Button>
                <Button
                  type='primary'
                  icon={<SaveOutlined />}
                  loading={saveOrderMutation.isPending}
                  onClick={() => saveOrderMutation.mutate()}
                >
                  Save Order
                </Button>
              </>
            ) : null}
            <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateLocationOpen(true)}>
              New Location
            </Button>
          </Space>
        ) : undefined
      }
    >
      {editable ? (
        <DragSortTable<LocationDto>
          rowKey='id'
          search={false}
          options={false}
          pagination={false}
          loading={loading}
          dataSource={displayedRows}
          columns={columns}
          dragSortKey='sort'
          onDragSortEnd={(_, __, newDataSource) => {
            const reordered = (newDataSource as LocationDto[]).map((location, index) => ({
              ...location,
              position: index + 1,
            }));
            setReorderDraft(reordered);
          }}
        />
      ) : (
        <ProTable<LocationDto>
          rowKey='id'
          search={false}
          options={false}
          pagination={false}
          loading={loading}
          dataSource={locations}
          columns={readOnlyColumns}
        />
      )}

      <ModalForm<LocationFormValues>
        title='Create Location'
        open={editable && createLocationOpen}
        modalProps={{ destroyOnClose: true }}
        onOpenChange={setCreateLocationOpen}
        {...formLayout}
        onFinish={async (values) => {
          const nextPosition = locations.reduce(
            (maxPosition, location) => Math.max(maxPosition, location.position),
            0
          ) + 1;

          await createLocationMutation.mutateAsync(
            buildLocationPayload(palaceId, values, nextPosition)
          );
          return true;
        }}
      >
        <ProFormText
          name='name'
          label='Name'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter location name (e.g., Front Gate)' }}
        />
        <ProFormText
          name='description'
          label='Description'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Describe what the learner should visualize here' }}
        />
        <ProForm.Item name='imageUrl' label='Location Image' rules={[{ required: true }]}>
          <ImageUploadField category='location' />
        </ProForm.Item>
      </ModalForm>

      <ModalForm<LocationFormValues>
        key={editingLocation?.id ?? 'edit-location'}
        title='Edit Location'
        open={editable && !!editingLocation}
        modalProps={{ destroyOnClose: true }}
        {...formLayout}
        initialValues={
          editingLocation
            ? {
                name: editingLocation.name,
                description: editingLocation.description,
                imageUrl: editingLocation.imageUrl,
              }
            : undefined
        }
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingLocation(null);
        }}
        onFinish={async (values) => {
          if (!editingLocation) return false;
          await updateLocationMutation.mutateAsync({
            id: editingLocation.id,
            payload: buildLocationPayload(palaceId, values, editingLocation.position),
          });
          return true;
        }}
      >
        <ProFormText
          name='name'
          label='Name'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Enter location name (e.g., Front Gate)' }}
        />
        <ProFormText
          name='description'
          label='Description'
          rules={[{ required: true }]}
          fieldProps={{ placeholder: 'Describe what the learner should visualize here' }}
        />
        <ProForm.Item name='imageUrl' label='Location Image' rules={[{ required: true }]}>
          <ImageUploadField category='location' />
        </ProForm.Item>
      </ModalForm>
    </Card>
  );
}
