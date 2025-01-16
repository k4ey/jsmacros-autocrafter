/* CONFIG */
const CONFIG = {
  chests: [
    { x: 37, y: 53, z: 4 },
    { x: 37, y: 53, z: 3 },
    { x: 37, y: 53, z: 2 },
    { x: 37, y: 53, z: 1 }
  ],
  offset: { x: 1, y: 0, z: 0 },
  lookOffset: { x: 0.5, y: 0, z: 0.5 },

  take: [
    "minecraft:gold_nugget",
  ],
  craft: [
    'minecraft:gold_ingot',
    'minecraft:gold_ingot_from_nuggets',
    'minecraft:gold_block'
  ],
  clickDelay: 100,
  craftingTableOffset: { x: 1, y: -1, z: 0 },
  storeWhen: [
    { id: "minecraft:gold_block", amount: 64 },
  ],
  storage: { x: 47, y: 53, z: 3 },
  storageOffset: { x: 1, y: 0, z: 0 },
  storageLookOffset: { x: 0.5, y: 0, z: 0.5 }





}
function any(a: any) {
  return a as any
}

function baritoneGoto(x: number, y: number, z: number) {
  const API = Java.type("baritone.api.BaritoneAPI");
  const baritone = any(API).getProvider().getPrimaryBaritone();
  const CustomGoalProcess = baritone.getCustomGoalProcess()
  const Goal = Java.type("baritone.api.pathing.goals.GoalBlock")
  CustomGoalProcess.setGoalAndPath(new (Goal as any)(x, y, z))
}

function atPosition(x: number, y: number, z: number) {
  const pos = Player.getPlayer().getBlockPos()
  return pos.getX() === Math.floor(x) && pos.getY() === Math.floor(y) && pos.getZ() === Math.floor(z)
}

function waitForOpen(slots: number) {
  while (Player.openInventory().getTotalSlots() != slots) {
    Chat.log(Player.openInventory().getTotalSlots())
    Time.sleep(100);
  }
}


function openChest(x: number, y: number, z: number) {
  baritoneGoto(x + CONFIG.offset.x, y + CONFIG.offset.y, z + CONFIG.offset.z)
  while (!atPosition(x + CONFIG.offset.x, y + CONFIG.offset.y, z + CONFIG.offset.z)) {
    Time.sleep(100)
    Chat.log('test')
  }
  Player.getPlayer().lookAt(x, y, z)
  KeyBind.pressKeyBind("key.use")
  waitForOpen(90)
}


function emptySlots(): number {
  const inventory = Player.openInventory()
  const slots = inventory.getMap()["main"].concat(inventory.getMap()["hotbar"])
  const empty = slots.filter((slot) => inventory.getSlot(slot).isEmpty())
  return empty.length
}

function openCraftingTable() {
  const playerPos = Player.getPlayer().getBlockPos()
  Player.getPlayer().lookAt(playerPos.getX() + CONFIG.lookOffset.x, playerPos.getY() + CONFIG.lookOffset.y, playerPos.getZ() + CONFIG.lookOffset.z)
  KeyBind.pressKeyBind("key.use")
}

function craftItem(item: string) {
  const inventory = Player.openInventory() as RecipeInventory
  let failed = false
  while (!failed) {
    Chat.log("test" + inventory.getCraftableRecipes())
    const recipe = inventory.getCraftableRecipes().find((r) => r.getId() === item)
    if (!recipe) break;
    failed = !recipe.canCraft()
    if (!failed) {
      recipe.craft(true)
      inventory.quick(inventory.getMap()["output"][0])
    }
  }
}

function craftItems(items: string[]) {
  openCraftingTable()
  waitForOpen(46)
  items.forEach((item) => {
    craftItem(item)
    Time.sleep(100)
  })
  Player.openInventory().close()
}

function takeItem(id: string) {
  const inventory = Player.openInventory()
  const allItems = inventory.getMap()["container"].map((slot) => { return { id: inventory.getSlot(slot).getItemId(), slot } })
  Chat.log(allItems)
  const items = allItems.filter((item) => item.id === id)
  const empty = emptySlots()
  for (let i = 0; i < empty; i++) {
    const item = items[i]
    if (!item) break
    inventory.quick(item.slot)
    Time.sleep(CONFIG.clickDelay)
  }
  inventory.close()
  Time.sleep(100)
}

function shouldStore() {
  return CONFIG.storeWhen.some((toStore) => {
    const inventory = Player.openInventory()
    const allItems = inventory.getMap()["main"].concat(inventory.getMap()["hotbar"]).map((slot) => { return { item: inventory.getSlot(slot), slot } })
    const items = allItems.filter((item) => item.item.getItemId() === toStore.id)
    const amount = items.reduce((acc, item) => acc + item.item.getCount(), 0)
    Chat.log(amount)
    return amount >= toStore.amount
  })
}

function putItems(id: string) {
  const inventory = Player.openInventory()
  const allItems = inventory.getMap()["main"].concat(inventory.getMap()["hotbar"]).map((slot) => { return { item: inventory.getSlot(slot), slot } })
  const items = allItems.filter((item) => item.item.getItemId() === id)
  items.forEach((item) => {
    inventory.quick(item.slot)
    Time.sleep(CONFIG.clickDelay)
  })
}



function storeItems() {
  const goal = [CONFIG.storage.x + CONFIG.storageOffset.x, CONFIG.storage.y + CONFIG.storageOffset.y, CONFIG.storage.z + CONFIG.storageOffset.z] as [number, number, number]
  baritoneGoto(...goal)
  while (!atPosition(...goal)) {
    Chat.log("not at pos")
    Time.sleep(100)
  }
  Player.getPlayer().lookAt(CONFIG.storage.x + CONFIG.storageLookOffset.x, CONFIG.storage.y + CONFIG.storageLookOffset.y, CONFIG.storage.z + CONFIG.storageLookOffset.z)
  KeyBind.pressKeyBind("key.use")
  waitForOpen(63)

  CONFIG.storeWhen.forEach((toStore) => {
    putItems(toStore.id)
  })
  Player.openInventory().close()
}

const on = GlobalVars.toggleBoolean("AUTOCRAFTER")
Chat.log("AUTOCRAFTER: " + on)
while (on) {
  for (let i = 0; i < CONFIG.chests.length; i++) {
    if (!on) break;
    const goal = [CONFIG.chests[i].x, CONFIG.chests[i].y, CONFIG.chests[i].z] as [number, number, number]
    openChest(...goal)
    CONFIG.take.forEach((item) => {
      takeItem(item)
    })
    craftItems(CONFIG.craft)
    if (shouldStore()) {
      storeItems()
    }
  }
}
