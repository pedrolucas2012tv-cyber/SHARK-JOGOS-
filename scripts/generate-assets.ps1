Add-Type -AssemblyName System.Drawing

$og = New-Object System.Drawing.Bitmap(1200, 630)
$identity = Get-Content -Raw -Encoding UTF8 'src/data/identity.json' | ConvertFrom-Json
$g = [System.Drawing.Graphics]::FromImage($og)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#09090B'))

$glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#111116'))
$g.FillRectangle($glowBrush, 54, 54, 1092, 522)
$profile = [System.Drawing.Image]::FromFile((Resolve-Path 'public/images/profile.png'))
$g.DrawImage($profile, (New-Object System.Drawing.Rectangle(118, 85, 374, 468)), 0, 0, $profile.Width, $profile.Height, [System.Drawing.GraphicsUnit]::Pixel)
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(32, 255, 255, 255), 2)
$g.DrawRectangle($borderPen, 118, 85, 374, 468)

$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FF284F'))
$primaryBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#EDEDF0'))
$secondaryBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#A1A1AC'))
$monoFont = New-Object System.Drawing.Font('Consolas', 15, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$displayFont = New-Object System.Drawing.Font('Segoe UI', 82, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$bodyFont = New-Object System.Drawing.Font('Segoe UI', 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('PROFILE  /  TAVV', $monoFont, $accentBrush, 568, 164)
$g.DrawString('tavvkkj', $displayFont, $primaryBrush, 555, 202)
$bioParts = $identity.bio -split 'mal, '
$g.DrawString("$($bioParts[0])mal,", $bodyFont, $secondaryBrush, 568, 340)
$g.DrawString($bioParts[1], $bodyFont, $secondaryBrush, 568, 384)
$g.DrawString('tavvkkj.xyz', $monoFont, $accentBrush, 570, 474)

$og.Save('public/og/og-image.png', [System.Drawing.Imaging.ImageFormat]::Png)
$profile.Dispose(); $glowBrush.Dispose(); $borderPen.Dispose(); $accentBrush.Dispose(); $primaryBrush.Dispose(); $secondaryBrush.Dispose(); $monoFont.Dispose(); $displayFont.Dispose(); $bodyFont.Dispose(); $g.Dispose(); $og.Dispose()
