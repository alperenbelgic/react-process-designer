import './Designer.css'
import { MouseEvent, useCallback, useContext, useReducer, useState } from 'react';
import { ActivityVisualState, Item, ItemModel, ItemVisualState, JointVisualState } from '../item/Item'
import { DesignerClickedEventArgs, SelectingRectangle } from '../selecting-rectangle/SelectingRectangle';
import { MouseDragContext } from '../../contexts/MouseDragService';
import { Link, getLinks, LinkModel } from '../link/Link';
import { getUniqueId } from '../../services/getUniqueId';

const initialItems: ItemModel[] = [
  {
    itemType: 'Activity',
    visualState: Object.assign(new ActivityVisualState(),
      {
        left: 30,
        top: 297,
        selected: true
      }),
    value: { id: '1', linkedItems: ['2'] }
  },
  {
    itemType: 'Activity',
    visualState: Object.assign(new ActivityVisualState(),
      {
        left: 330,
        top: 297,
        selected: true
      }),
    value: { id: '2', linkedItems: ['3'] }
  },
  {
    itemType: 'Activity',
    visualState: Object.assign(new ActivityVisualState(),
      {
        left: 630,
        top: 297,
        selected: true
      }),
    value: { id: '3', linkedItems: ['4'] }
  },
  {
    itemType: 'Joint',
    visualState: Object.assign(new JointVisualState(),
      {
        left: 715,
        top: 191,
        selected: true,
        defaultWidth: 30,
        defaultHeight: 30
      }),
    value: { id: '4', linkedItems: ['5'] }
  },
  {
    itemType: 'Joint',
    visualState: Object.assign(new JointVisualState(),
      {
        left: 115,
        top: 191,
        selected: true,
        defaultWidth: 30,
        defaultHeight: 30
      }),
    value: { id: '5', linkedItems: ['1'] }
  },
];

function getItemsInMap(items: ItemModel[]): { [key: string]: ItemModel } {

  const map: { [key: string]: ItemModel } = {}

  items.forEach(item => {
    map[item.value.id] = item;
  });

  return map;
}

function itemsLeftView(items: ItemModel[]) {
  return items.some(i => i.visualState.left < 0 || i.visualState.top < 0);
}

function placeItemInHorizontalLine(i: ItemModel) {
  const laneHeight = 140;

  if (i.itemType === 'Activity') {

    const mod = (i.visualState.top - 17) % laneHeight;

    if (mod === 0) return;

    if (mod < (laneHeight / 2)) {
      i.visualState.top -= mod;
    }
    else {
      i.visualState.top += (laneHeight - mod);
    }
  }

  if (i.itemType === 'Joint') {

    const mod = (i.visualState.top - 51) % (laneHeight / 2);

    if (mod === 0) return;

    if (mod < (laneHeight / 4)) {
      i.visualState.top -= mod;
    }
    else {
      i.visualState.top += ((laneHeight / 2) - mod);
    }
  }
}

function placeItemsInHorizontalLine(moving: ItemModel[]) {
  moving.forEach(i => {
    placeItemInHorizontalLine(i);
  })
}

function placeItemsInVerticalLine(movingItems: ItemModel[], standingItems: ItemModel[]) {

  // if a connected item is vertically closer than, let's say, 100px, align them on the same line.  

  // map objects are to prevent O(n^2) loops
  let standingIdObjectMap: {
    [key: string]: ItemModel
  } = {};
  let invertedLinksOfStandingItems: {
    [id: string]: ItemModel[]
  } = {};

  standingItems.forEach(standingItem => {
    standingIdObjectMap[standingItem.value.id] = standingItem;

    standingItem.value.linkedItems.forEach(linkedItem => {
      if (invertedLinksOfStandingItems[linkedItem] === undefined) {
        invertedLinksOfStandingItems[linkedItem] = [standingItem];
      }
      else {
        invertedLinksOfStandingItems[linkedItem].push(standingItem);
      }
    });
  });

  movingItems.forEach(movingItem => {
    let newCenterForMovingItem: number | null = null;

    // links from moving item to standing item
    movingItem.value.linkedItems.forEach(li => {

      const linkedStandingItem = standingIdObjectMap[li];

      if (!linkedStandingItem) return;

      const verticalGap = Math.abs(movingItem.visualState.getVCenter() - linkedStandingItem.visualState.getVCenter());

      if (verticalGap < 100) {
        const gapFromAnotherLinkedItem = Math.abs(movingItem.visualState.getVCenter() - (newCenterForMovingItem ?? Number.MAX_SAFE_INTEGER));

        if (verticalGap < gapFromAnotherLinkedItem) {
          newCenterForMovingItem = Math.min(newCenterForMovingItem ?? Number.MAX_SAFE_INTEGER, linkedStandingItem.visualState.getVCenter());
        }
      }
    });

    // links from standing item to moving item
    (invertedLinksOfStandingItems[movingItem.value.id] ?? []).forEach(standingItem => {

      const verticalGap = Math.abs(movingItem.visualState.getVCenter() - standingItem.visualState.getVCenter());

      if (verticalGap < 100) {
        const gapFromAnotherLinkedItem = Math.abs(movingItem.visualState.getVCenter() - (newCenterForMovingItem ?? Number.MAX_SAFE_INTEGER));

        if (verticalGap < gapFromAnotherLinkedItem) {
          newCenterForMovingItem = Math.min(newCenterForMovingItem ?? Number.MAX_SAFE_INTEGER, standingItem.visualState.getVCenter());
        }
      }
    });

    if (newCenterForMovingItem) {
      movingItem.visualState.setVCenter(newCenterForMovingItem);
    }

  });

}

type DesignerAction =
  | { type: 'revert-item-selection', item: ItemModel, setSelectionTo?: boolean, ctrl?: boolean }
  | { type: 'unselect-all' }
  | { type: 'handle-items-dragging', shiftX: number, shiftY: number }
  | { type: 'handle-items-dragging-ended', canceled: boolean }
  | { type: 'handle-selecting-rectangle-drawn', selectionLocation: { top: number, left: number, bottom: number, right: number } }
  | { type: 'add-joint', linkModel: LinkModel }

interface DesignerState {
  items: ItemModel[];

}

const DesignerReducer = (state: DesignerState, action: DesignerAction): DesignerState => {
  switch (action.type) {
    case 'revert-item-selection': {

      let remainingItems = state.items.filter(i => i.value.id !== action.item.value.id);
      const itemInList = state.items.find(i => i.value.id === action.item.value.id) ?? {} as ItemModel;

      if (!action.ctrl) {
        // make them all others unselected
        remainingItems = remainingItems.map((i: ItemModel) => {
          return {
            ...i,
            visualState: Object.assign(new ItemVisualState(), {
              ...i.visualState,
              selected: false
            })
          }
        });
      }

      remainingItems.push({
        ...itemInList,
        visualState: Object.assign(new ItemVisualState(), {
          ...itemInList.visualState,
          selected: action.setSelectionTo ?? !itemInList?.visualState.selected
        })
      });

      return {
        ...state,
        items: remainingItems
      };
    }
    case 'unselect-all': {
      const remainingItems = state.items.filter(i => !i.visualState.selected);

      state.items.filter(i => i.visualState.selected).forEach(j => {
        remainingItems.push({
          ...j,
          visualState: Object.assign(new ItemVisualState(),
            {
              ...j.visualState,
              selected: false
            })
        })
      })

      return { ...state, items: remainingItems };
    }
    case 'handle-items-dragging': {

      const selected = state.items.filter(i => i.visualState.selected);
      const remaining = state.items.filter(i => !i.visualState.selected)

      selected.forEach(i => {
        remaining.push({
          ...i,
          visualState: Object.assign(new ItemVisualState(), {
            ...i.visualState,
            xShift: action.shiftX,
            yShift: action.shiftY,
            dragging: true
          })
        })
      });

      return {
        ...state,
        items: remaining
      };
    }
    case 'handle-items-dragging-ended': {
      const moving = state.items.filter(i => i.visualState.dragging);
      const remaining = state.items.filter(i => !i.visualState.dragging);

      const canceled = action.canceled || itemsLeftView(moving);

      moving.forEach(i => {

        if (canceled) {
          i.visualState.xShift = i.visualState.yShift = 0;
        }
        else {
          i.visualState.includeShift();
        }
      });

      if (!canceled) {
        placeItemsInHorizontalLine(moving);

        placeItemsInVerticalLine(moving, remaining);
      }

      moving.forEach(i => {

        remaining.push({
          ...i,
          visualState: Object.assign(new ItemVisualState(), {
            ...i.visualState,
            dragging: false
          })
        })
      });

      return { ...state, items: remaining };
    }
    case 'handle-selecting-rectangle-drawn': {
      const _selectedItems: ItemModel[] = [];
      const _remainingItems: ItemModel[] = [];

      state.items.forEach(i => {
        const itemTop = i.visualState.top;
        const itemLeft = i.visualState.left;
        const itemRight = i.visualState.left + i.visualState.defaultWidth;
        const itemBottom = i.visualState.top + i.visualState.defaultHeight;

        if (itemTop > action.selectionLocation.bottom ||
          action.selectionLocation.top > itemBottom ||
          itemRight < action.selectionLocation.left ||
          action.selectionLocation.right < itemLeft) {

          _remainingItems.push(i);
        }
        else {
          _selectedItems.push(i);
        }
      });

      _selectedItems.forEach(i => {
        _remainingItems.push({
          ...i,
          visualState: Object.assign(new ItemVisualState(),
            {
              ...i.visualState,
              selected: true
            })
        })
      });

      return { ...state, items: _remainingItems };
    }
    case 'add-joint': {
      const linkModel = action.linkModel;

      const startItem = linkModel.startItem;
      const endItem = linkModel.endItem;

      const jointVCenter = startItem.visualState.getVCenter() / 2 + endItem.visualState.getVCenter() / 2;
      const jointHCenter = startItem.visualState.getHCenter() / 2 + endItem.visualState.getHCenter() / 2;

      let jointVisualState = new JointVisualState();
      jointVisualState.setVCenter(jointVCenter);
      jointVisualState.setHCenter(jointHCenter);

      const jointItem: ItemModel = {
        itemType: 'Joint',
        value: { id: getUniqueId(), linkedItems: [endItem.value.id] },
        visualState: jointVisualState
      };

      // start item removes end item from linked items
      startItem.value.linkedItems = startItem.value.linkedItems.filter(li => li !== endItem.value.id);
      startItem.value.linkedItems.push(jointItem.value.id);
      const newStartItem: ItemModel = {
        ...startItem,
        value: { ...startItem.value },
      }

      const newItemList = state.items.filter(i => i.value.id !== startItem.value.id && i.value.id !== endItem.value.id);

      newItemList.push(newStartItem);
      newItemList.push(endItem);
      newItemList.push(jointItem);

      return { ...state, items: newItemList };
    }
  }
}

function useDesignerReducer(initialItems: ItemModel[]) {
  const [designerState, dispatch] = useReducer(DesignerReducer, { items: initialItems });

  const unselectAll = useCallback(() =>
    dispatch({ type: 'unselect-all' })
    , []);

  const handleItemsDragging = useCallback((shiftX: number, shiftY: number) =>
    dispatch({ type: 'handle-items-dragging', shiftX, shiftY })
    , []);

  const handleItemsDraggingEnded = useCallback((canceled: boolean) =>
    dispatch({ type: 'handle-items-dragging-ended', canceled })
    , []);

  const revertItemSelection = useCallback((item: ItemModel, setSelectionTo: boolean, ctrl: boolean) =>
    dispatch({ type: 'revert-item-selection', item, setSelectionTo: true, ctrl: ctrl })
    , []);

  const handleSelectingRectangleDrawn = useCallback(
    (selectionLocation: { top: number, left: number, bottom: number, right: number }) =>
      dispatch({ type: 'handle-selecting-rectangle-drawn', selectionLocation })
    , []);

  const addJoint = useCallback((linkModel: LinkModel) => {
    dispatch({ type: 'add-joint', linkModel });
  }, [])

  return {
    designerState,
    unselectAll,
    handleItemsDragging,
    handleItemsDraggingEnded,
    revertItemSelection,
    handleSelectingRectangleDrawn, 
    addJoint
  };
}

export function Designer() {

  const {
    designerState,
    unselectAll,
    handleItemsDragging,
    handleItemsDraggingEnded,
    revertItemSelection,
    handleSelectingRectangleDrawn, 
    addJoint
  } = useDesignerReducer(initialItems);

  const [designerClickedEvent, setDesignerClickedEvent] = useState<DesignerClickedEventArgs | null>(null);

  const handleMouseDown = useCallback((event: MouseEvent<HTMLDivElement>) => {

    setDesignerClickedEvent({
      xInContainer: (event.nativeEvent as any).offsetX,
      yInContainer: (event.nativeEvent as any).offsetY,
      xInViewPort: event.clientX,
      yInViewPort: event.clientY
    });

    unselectAll();

  }, [unselectAll]);

  const mouseDragContext = useContext(MouseDragContext);

  const handleItemClicked =
    useCallback(
      (item: ItemModel, relativeX: number, relativeY: number, clientX: number, clientY: number, ctrl: boolean) => {

        const isItemSelectedBeforeClick = item.visualState.selected;

        if (!isItemSelectedBeforeClick) {
          revertItemSelection(item, true, ctrl);
        }

        mouseDragContext.startDragging(relativeY, relativeY, clientX, clientY, {

          onMouseMoved: (x, y, shiftX, shiftY) => {

            handleItemsDragging(shiftX, shiftY);

          },
          onMouseUp: (canceled: boolean) => {

            if (canceled) {

              if (!ctrl && isItemSelectedBeforeClick && designerState.items.filter(i => i.visualState.selected).length > 1) {
                // there are other selected items and we click a selected one
                // in this case (I think) we keep only clicked one selected
                // instead of making them all unselected
                // I just feel like this :)
                revertItemSelection(item, true, false);
              }
              else {
                revertItemSelection(item, !isItemSelectedBeforeClick, ctrl);
              }
            }

            handleItemsDraggingEnded(canceled);
          }
        });

      }, [handleItemsDraggingEnded, handleItemsDragging, revertItemSelection, mouseDragContext, designerState.items]);

  const links = useCallback(() => getLinks(designerState.items), [designerState.items]);

  return (

    <div className="container">

      <div className="header">
        header
      </div>

      <div className="page-content">

        <div className="left-menu">
          <div className="menu-container" >

          </div>
          <div className="button-container" >
            <button>Save</button>
          </div>
        </div>
        <div id="designer-container" className="designer-container" onMouseDown={handleMouseDown} >

          {/* this (positon:relative) div is for providing 
          an immediate non static parent for absolute positioned children*/}
          <div className="designer-relative-container">

            {
              links().map(link => <Link linkModel={link} key={link.id} addJoint={addJoint} />)
            }

            {
              designerState.items.map(item => <Item key={item.value.id} itemModel={item} onClicked={handleItemClicked} />)
            }

            <SelectingRectangle
              key="selectingRect"
              designerClicked={designerClickedEvent}
              rectangleDrawn={handleSelectingRectangleDrawn} />

          </div>
        </div>

      </div>

    </div>

  );
}

