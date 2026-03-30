import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { apiTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'

// GET /api/shortcuts/download — returns a personalized .shortcut file
// Token is embedded inside the shortcut URL — user never sees it
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create shortcuts token
    const [existing] = await db.select()
      .from(apiTokens)
      .where(and(
        eq(apiTokens.userId, user.id),
        eq(apiTokens.name, 'shortcuts'),
      ))
      .limit(1)

    let token: string
    if (existing) {
      token = existing.token
    } else {
      token = `axs-${crypto.randomBytes(4).toString('hex')}`
      await db.insert(apiTokens).values({
        userId: user.id,
        token,
        name: 'shortcuts',
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axs-tracker.app'
    const syncUrl = `${baseUrl}/api/health/sync?user_token=${token}`

    // Build Shortcuts plist with token baked in
    const plist = buildShortcutPlist(syncUrl)

    return new NextResponse(plist, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-apple-aspen-config',
        'Content-Disposition': 'attachment; filename="AXS Health Sync.shortcut"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generating shortcut:', error)
    return NextResponse.json({ error: 'Failed to generate shortcut' }, { status: 500 })
  }
}

function buildShortcutPlist(syncUrl: string): string {
  // UUIDs for action wiring
  const healthUUID = randomUUID()
  const dateUUID = randomUUID()
  const formatUUID = randomUUID()
  const urlUUID = randomUUID()
  const notifyUUID = randomUUID()

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>WFWorkflowActions</key>
  <array>
    <!-- Step 1: Get today's step count -->
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.gethealthsample</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>UUID</key>
        <string>${healthUUID}</string>
        <key>WFHealthSampleName</key>
        <string>Step Count</string>
        <key>WFHealthDateUnit</key>
        <string>Today</string>
        <key>WFQuantitySummarization</key>
        <string>Sum</string>
      </dict>
    </dict>
    <!-- Step 2: Get current date -->
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.date</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>UUID</key>
        <string>${dateUUID}</string>
      </dict>
    </dict>
    <!-- Step 3: Format date as yyyy-MM-dd -->
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.format.date</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>UUID</key>
        <string>${formatUUID}</string>
        <key>WFDateFormatStyle</key>
        <string>Custom</string>
        <key>WFDateFormat</key>
        <string>yyyy-MM-dd</string>
        <key>WFDate</key>
        <dict>
          <key>Value</key>
          <dict>
            <key>Type</key>
            <string>ActionOutput</string>
            <key>OutputUUID</key>
            <string>${dateUUID}</string>
          </dict>
          <key>WFSerializationType</key>
          <string>WFTextTokenAttachment</string>
        </dict>
      </dict>
    </dict>
    <!-- Step 4: POST to AXS API (token baked into URL) -->
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.downloadurl</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>UUID</key>
        <string>${urlUUID}</string>
        <key>WFURL</key>
        <dict>
          <key>Value</key>
          <dict>
            <key>string</key>
            <string>${syncUrl}&amp;date=\uFFFC&amp;steps=\uFFFC</string>
            <key>attachmentsByRange</key>
            <dict>
              <key>{${syncUrl.length + 6}, 1}</key>
              <dict>
                <key>Type</key>
                <string>ActionOutput</string>
                <key>OutputUUID</key>
                <string>${formatUUID}</string>
              </dict>
              <key>{${syncUrl.length + 14}, 1}</key>
              <dict>
                <key>Type</key>
                <string>ActionOutput</string>
                <key>OutputUUID</key>
                <string>${healthUUID}</string>
              </dict>
            </dict>
          </dict>
          <key>WFSerializationType</key>
          <string>WFTextTokenString</string>
        </dict>
        <key>WFHTTPMethod</key>
        <string>POST</string>
        <key>WFHTTPBodyType</key>
        <string>JSON</string>
        <key>WFJSONValues</key>
        <dict>
          <key>Value</key>
          <dict>
            <key>WFDictionaryFieldValueItems</key>
            <array>
              <dict>
                <key>WFItemType</key>
                <integer>0</integer>
                <key>WFKey</key>
                <dict>
                  <key>Value</key>
                  <dict>
                    <key>string</key>
                    <string>date</string>
                    <key>attachmentsByRange</key>
                    <dict/>
                  </dict>
                  <key>WFSerializationType</key>
                  <string>WFTextTokenString</string>
                </dict>
                <key>WFValue</key>
                <dict>
                  <key>Value</key>
                  <dict>
                    <key>string</key>
                    <string>\uFFFC</string>
                    <key>attachmentsByRange</key>
                    <dict>
                      <key>{0, 1}</key>
                      <dict>
                        <key>Type</key>
                        <string>ActionOutput</string>
                        <key>OutputUUID</key>
                        <string>${formatUUID}</string>
                      </dict>
                    </dict>
                  </dict>
                  <key>WFSerializationType</key>
                  <string>WFTextTokenString</string>
                </dict>
              </dict>
              <dict>
                <key>WFItemType</key>
                <integer>1</integer>
                <key>WFKey</key>
                <dict>
                  <key>Value</key>
                  <dict>
                    <key>string</key>
                    <string>steps</string>
                    <key>attachmentsByRange</key>
                    <dict/>
                  </dict>
                  <key>WFSerializationType</key>
                  <string>WFTextTokenString</string>
                </dict>
                <key>WFValue</key>
                <dict>
                  <key>Value</key>
                  <dict>
                    <key>string</key>
                    <string>\uFFFC</string>
                    <key>attachmentsByRange</key>
                    <dict>
                      <key>{0, 1}</key>
                      <dict>
                        <key>Type</key>
                        <string>ActionOutput</string>
                        <key>OutputUUID</key>
                        <string>${healthUUID}</string>
                      </dict>
                    </dict>
                  </dict>
                  <key>WFSerializationType</key>
                  <string>WFTextTokenString</string>
                </dict>
              </dict>
              <dict>
                <key>WFItemType</key>
                <integer>0</integer>
                <key>WFKey</key>
                <dict>
                  <key>Value</key>
                  <dict>
                    <key>string</key>
                    <string>source</string>
                    <key>attachmentsByRange</key>
                    <dict/>
                  </dict>
                  <key>WFSerializationType</key>
                  <string>WFTextTokenString</string>
                </dict>
                <key>WFValue</key>
                <dict>
                  <key>Value</key>
                  <dict>
                    <key>string</key>
                    <string>shortcuts</string>
                    <key>attachmentsByRange</key>
                    <dict/>
                  </dict>
                  <key>WFSerializationType</key>
                  <string>WFTextTokenString</string>
                </dict>
              </dict>
            </array>
          </dict>
          <key>WFSerializationType</key>
          <string>WFDictionaryFieldValue</string>
        </dict>
      </dict>
    </dict>
    <!-- Step 5: Notify -->
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.notification</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>UUID</key>
        <string>${notifyUUID}</string>
        <key>WFNotificationActionTitle</key>
        <string>AXS Health Sync</string>
        <key>WFNotificationActionBody</key>
        <dict>
          <key>Value</key>
          <dict>
            <key>string</key>
            <string>Steps synced: \uFFFC ✓</string>
            <key>attachmentsByRange</key>
            <dict>
              <key>{15, 1}</key>
              <dict>
                <key>Type</key>
                <string>ActionOutput</string>
                <key>OutputUUID</key>
                <string>${healthUUID}</string>
              </dict>
            </dict>
          </dict>
          <key>WFSerializationType</key>
          <string>WFTextTokenString</string>
        </dict>
        <key>WFNotificationActionSound</key>
        <true/>
      </dict>
    </dict>
  </array>
  <key>WFWorkflowClientRelease</key>
  <string>2.0</string>
  <key>WFWorkflowClientVersion</key>
  <string>2284</string>
  <key>WFWorkflowHasShortcutInputVariables</key>
  <false/>
  <key>WFWorkflowIcon</key>
  <dict>
    <key>WFWorkflowIconGlyphNumber</key>
    <integer>59511</integer>
    <key>WFWorkflowIconStartColor</key>
    <integer>946986751</integer>
  </dict>
  <key>WFWorkflowImportQuestions</key>
  <array/>
  <key>WFWorkflowInputContentItemClasses</key>
  <array/>
  <key>WFWorkflowMinimumClientVersion</key>
  <integer>900</integer>
  <key>WFWorkflowName</key>
  <string>AXS Health Sync</string>
  <key>WFWorkflowOutputContentItemClasses</key>
  <array/>
  <key>WFWorkflowTypes</key>
  <array>
    <string>NCWidget</string>
    <string>WatchKit</string>
  </array>
</dict>
</plist>`
}

function randomUUID(): string {
  return crypto.randomUUID().toUpperCase()
}
