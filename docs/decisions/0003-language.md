# 0003 Interface language: English first, Norwegian-ready

Date: 2026-10-09 · Status: accepted

## Context
The repository description is Norwegian ("portal for innleveringer, emneplanlegging og informasjon"), while the brief and team communicate in English.

## Decision
Ship the UI in English. Keep user-facing strings out of deep component logic so a Norwegian (bokmål) translation can be added later without restructuring. Dates use the browser locale.

## Consequences
Norwegian institutions are a likely audience; i18n is a P1 follow-up, tracked as an issue.
