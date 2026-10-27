#!/bin/zsh
# usage: ./render_report.sh Experiment_6_Output/Expt_06_Ballot_Contract   (no extension)
# md -> html (pandoc) -> pdf (headless Chrome via agent-browser); overwrites the PDF at the same path.
set -e
base="$1"; here="${0:A:h}"
md="$here/$base.md"; html="$here/$base.html"; pdf="$here/$base.pdf"
title=$(sed -n 's/^# //p' "$md" | head -1)
pandoc "$md" -c "$here/sources/report_style.css" -s -o "$html" --metadata pagetitle="$title"
export AGENT_BROWSER_SESSION=${AGENT_BROWSER_SESSION:-pdf-render}
agent-browser open "file://$html" >/dev/null && sleep 3 && agent-browser pdf "$pdf"
rm "$html"
echo "$base: $(pdfinfo "$pdf" | awk '/Pages/{print $2}') pages"
