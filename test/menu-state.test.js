import assert from 'node:assert/strict';
import test from 'node:test';
import { createMenuState, MENU_STATES } from '../src/ui/menuState.js';

test('menu begins in its intentionally incomplete initial state', () => {
  assert.equal(createMenuState().value, MENU_STATES.INITIAL);
});

test('only the first tap begins the reveal', () => {
  const menu = createMenuState();
  assert.equal(menu.beginReveal(), true);
  assert.equal(menu.value, MENU_STATES.REVEALING);
  assert.equal(menu.beginReveal(), false);
  assert.equal(menu.value, MENU_STATES.REVEALING);
});

test('reveal completion makes the menu ready', () => {
  const menu = createMenuState();
  assert.equal(menu.completeReveal(), false);
  menu.beginReveal();
  assert.equal(menu.completeReveal(), true);
  assert.equal(menu.value, MENU_STATES.READY);
});

test('START becomes interactive only when the menu reaches READY', () => {
  const menu = createMenuState();
  assert.notEqual(menu.value, MENU_STATES.READY);
  menu.beginReveal();
  assert.notEqual(menu.value, MENU_STATES.READY);
  menu.completeReveal();
  assert.equal(menu.value, MENU_STATES.READY);
  menu.beginStart();
  assert.notEqual(menu.value, MENU_STATES.READY);
});

test('start is accepted once and only after reveal completion', () => {
  const menu = createMenuState();
  assert.equal(menu.beginStart(), false);
  menu.beginReveal();
  assert.equal(menu.beginStart(), false);
  menu.completeReveal();
  assert.equal(menu.beginStart(), true);
  assert.equal(menu.value, MENU_STATES.STARTING);
  assert.equal(menu.beginStart(), false);
});
