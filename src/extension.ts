import * as vscode from 'vscode';
import { parser, clearSerial } from './parser';

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.registerTextEditorCommand('serialer.parse', (textEditor => {
		let text = textEditor.document.getText();

		text = parser(text);

		var firstLine = textEditor.document.lineAt(0);
		var lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
		var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);

		textEditor.edit(editBuilder => {
			editBuilder.replace(textRange, text);
		});

	}));

	vscode.commands.registerTextEditorCommand('serialer.clear', (textEditor => {
		let text = textEditor.document.getText();

		text = clearSerial(text);

		var firstLine = textEditor.document.lineAt(0);
		var lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
		var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);

		textEditor.edit(editBuilder => {
			editBuilder.replace(textRange, text);
		});
	}));
}

export function deactivate() {}
