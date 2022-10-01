import { MoveableManagerInterface } from 'react-moveable';
import CutItStore from 'renderer/store/CutItStore';

export interface DeleteButtonViewableProps {
  deleteButtonViewable?: boolean;
}

export const DeleteButtonViewable = {
  name: 'deleteButtonViewable',
  props: {
    deleteButtonViewable: Boolean,
  },
  events: {},
  render(
    moveable: MoveableManagerInterface<{
      cutItStore: CutItStore;
    }>
  ) {
    const rect = moveable.getRect();
    const { pos2 } = moveable.state;
    const { cutItStore, target } = moveable.props;

    const DeleteButton = moveable.useCSS(
      'div',
      `
        {
            position: absolute;
            left: 0px;
            top: 0px;
            will-change: transform;
            transform-origin: 0px 0px;
            width: 24px;
            height: 24px;
            background: #44aaff7a;
            cursor: pointer;
            opacity: 0.9;
            border-radius: 4px;
        }
        :host:before, :host:after {
            content: "";
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: 16px;
            height: 2px;
            background: #fff;
            border-radius: 1px;
            cursor: pointer;
        }
        :host:after {
            transform: translate(-50%, -50%) rotate(-45deg);
        }
        `
    );
    return (
      <DeleteButton
        key="DeleteButton"
        className="moveable-delete-button"
        onClick={() => {
          cutItStore?.removeEleMarkById(target?.id || '');
        }}
        style={{
          transform: `translate(${pos2[0]}px, ${pos2[1]}px) rotate(${rect.rotation}deg) translate(10px)`,
        }}
      />
    );
  },
} as const;
